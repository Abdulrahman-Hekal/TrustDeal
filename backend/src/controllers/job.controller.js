const pinata = require("../utils/pinata");
const catchAsync = require("../utils/catch-async.utils");
const Job = require("../models/job.model.js");
const {
  createPreviewToken,
  verifyPreviewToken,
  encryptFile,
  streamAsInline,
  tempDecrypt,
  decryptFile,
} = require("../utils/crypto.js");
const AppError = require("../utils/error.utils.js");
const { Types } = require("mongoose");
const fs = require("node:fs");

// -------------------
// GET ALL JOBS
// -------------------
exports.getJobs = catchAsync(async (req, res) => {
  const jobs = await Job.find({ isDeleted: false }).select(
    "-encryptedFilePath -key -iv -authTag -mimetype"
  );

  res.json({
    message: "Get Jobs",
    data: jobs,
  });
});

// -------------------
// GET JOBS BY USER
// -------------------
exports.getJobsByUser = catchAsync(async (req, res) => {
  const { address } = req.params;
  const jobs = await Job.find({
    $or: [{ clientAddress: address }, { freelancerAddress: address }],
  }).select("-encryptedFilePath -key -iv -authTag -mimetype");

  res.json({
    message: "Get User Jobs",
    data: jobs,
  });
});

// -------------------
// GET JOB BY ID
// -------------------
exports.getJobById = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!Types.ObjectId.isValid(id)) throw new AppError("Invalid job ID", 400);

  const job = await Job.findById(id).select(
    "-encryptedFilePath -key -iv -authTag -mimetype"
  );
  if (!job) throw new AppError("Job not found", 404);

  res.json({
    message: "Get Job",
    data: job,
  });
});

// -------------------
// CREATE NEW JOB
// -------------------
exports.createJob = catchAsync(async (req, res) => {
  const { title, description, price, clientAddress, jobPeriod } = req.body;

  if (!title || !description || !price || !clientAddress || !jobPeriod) {
    throw new AppError("Missing required fields", 400);
  }

  const job = await Job.create({
    title,
    description,
    price,
    clientAddress,
    jobPeriod,
  });

  res.status(201).json({
    message: "Job created successfully",
    data: job,
  });
});

// -------------------
// ASSIGN FREELANCER
// -------------------
exports.assignFreelancer = catchAsync(async (req, res) => {
  const { freelancerAddress, deliveryDeadline, approvalDeadline } = req.body;

  if (!freelancerAddress) {
    throw new AppError("Missing required fields", 400);
  }

  const job = await Job.findByIdAndUpdate(
    req.params,
    { freelancerAddress, deliveryDeadline, approvalDeadline },
    { new: true }
  );

  res.status(201).json({
    message: "Freelancer assigned to your job successfully",
    data: job,
  });
});

// -------------------
// DELIVER THE WORK
// -------------------
exports.deliver = catchAsync(async (req, res) => {
  const jobId = req.params.id;
  const encryptedFile = await encryptFile(req.file.path);

  const buffer = fs.readFileSync(encryptedFile.outputPath);
  const file = new File([buffer], req.file.originalname, {
    type: req.file.mimetype || "application/octet-stream",
  });

  const upload = await pinata.upload.private.file(file);

  await Job.findByIdAndUpdate(
    jobId,
    {
      encryptedFilePath: encryptedFile.outputPath,
      key: encryptedFile.key,
      iv: encryptedFile.iv,
      authTag: encryptedFile.authTag,
      mimetype: upload.mime_type,
    },
    { new: true }
  );

  res.json({
    message: "Your work uploaded successfully",
    data: {
      cid: upload.cid,
      name: upload.name,
      size: upload.size,
      mime_type: upload.mime_type,
      fileUrl: `${pinata.config.pinataGateway}/ipfs/${upload.cid}`,
    },
  });
});

// -------------------
// GENERATE PREVIEW TOKEN
// -------------------
exports.generatePreview = catchAsync(async (req, res) => {
  const jobId = req.params.id;
  const { clientAddress } = req.body;

  if (!jobId || !clientAddress)
    throw new AppError("Missing jobId or clientAddress", 400);

  const job = await Job.findById(jobId);
  if (!job) throw new AppError("Job not found", 404);

  // Only client can request preview
  if (job.clientAddress !== clientAddress)
    throw new AppError("Not authorized", 403);

  const token = createPreviewToken(jobId, clientAddress);

  res.json({
    previewUrl: `${process.env.APP_URL}/api/jobs/preview/${token}`,
    expiresIn: "10m",
  });
});

// -------------------
// PREVIEW WORK
// -------------------
exports.previewWork = catchAsync(async (req, res) => {
  const payload = verifyPreviewToken(req.params.token);
  if (!payload) throw new AppError("Invalid or expired token", 403);

  const { jobId, clientAddress } = payload.jobId;

  const job = await Job.findById(jobId);
  if (!job) throw new AppError("Job not found", 404);

  // Authorization check — only client can preview
  if (job.clientAddress !== clientAddress)
    throw new AppError("Unauthorized access", 403);

  const tempFile = await tempDecrypt(
    job.encryptedFilePath,
    job.key,
    job.iv,
    job.authTag
  );
  streamAsInline(tempFile, job.mimetype, res);
});

// -------------------
// APPROVE WORK
// -------------------
exports.approveWork = catchAsync(async (req, res) => {
  const jobId = req.params.id;
  const { clientAddress } = req.body;

  const job = await Job.findById(jobId);
  if (!job) throw new AppError("Job not found", 404);

  // Only client can release
  if (job.clientAddress !== clientAddress)
    throw new AppError("Unauthorized", 403);

  // Check job status
  if (job.status !== "delivered")
    throw new AppError("Job is not yet delivered for approval", 400);

  // 🔹 2. Update job status
  job.status = "approved";
  await job.save();

  // Decrypt
  const decryptedFile = await decryptFile(
    job.encryptedFilePath,
    job.key,
    job.iv,
    job.authTag
  );

  // Upload
  const buffer = fs.readFileSync(decryptedFile.outputPath);
  const file = new File([buffer], decryptedFile.fileName, {
    type: job.mimetype || "application/octet-stream",
  });

  const upload = await pinata.upload.public.file(file);

  await Job.findByIdAndUpdate(
    jobId,
    {
      finalHash: upload.cid,
    },
    { new: true }
  );

  res.json({
    message: "Work approved successfully",
    data: {
      cid: upload.cid,
      name: upload.name,
      size: upload.size,
      mime_type: upload.mime_type,
      fileUrl: `${pinata.config.pinataGateway}/ipfs/${upload.cid}`,
    },
  });
});

// -------------------
// UPDATE JOB STATUS
// -------------------
exports.updateJobStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = [
    "pending",
    "funded",
    "deliverd",
    "approved",
    "refunded",
  ];
  if (!validStatuses.includes(status))
    throw new AppError("Invalid status value", 400);

  const job = await Job.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );

  if (!job) throw new AppError("Job not found", 404);

  res.json({
    message: "Job status updated successfully",
    data: job,
  });
});

// -------------------
// DELETE JOB (SOFT DELETE)
// -------------------
exports.deleteJob = catchAsync(async (req, res) => {
  const { id } = req.params;

  const job = await Job.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );

  if (!job) throw new AppError("Job not found", 404);

  res.json({ message: "Job deleted successfully" });
});
