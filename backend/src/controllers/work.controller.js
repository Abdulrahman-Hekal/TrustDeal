const { encryptFile } = require("../utils/crypto");
const pinata = require("../utils/pinata");
const catchAsync = require("../utils/catch-async.utils");
const fs = require("node:fs");

exports.upload = catchAsync(async (req, res) => {
  const encryptedPath = await encryptFile(req.file.path);

  const buffer = fs.readFileSync(encryptedPath.outputPath);
  const file = new File([buffer], req.file.originalname, {
    type: req.file.mimetype || "application/octet-stream",
  });

  const upload = await pinata.upload.public.file(file);

  res.json({
    cid: upload.cid,
    name: upload.name,
    size: upload.size,
    mime_type: upload.mime_type,
    fileUrl: `${pinata.config.pinataGateway}/ipfs/${upload.cid}`,
  });
});
