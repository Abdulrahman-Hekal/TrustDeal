const express = require("express");
const {
  deliver,
  createJob,
  assignFreelancer,
  getJobById,
  getJobsByUser,
  getJobs,
  generatePreview,
  updateJobStatus,
  deleteJob,
  previewWork,
  approveWork,
} = require("../controllers/job.controller");
const upload = require("../middlewares/upload.middleware");
const router = express.Router();

router.get("/", getJobs);
router.get("/user/:address", getJobsByUser);
router.get("/:id", getJobById);

router.post("/", createJob);
router.post("/deliver/:id", upload.single("file"), deliver);
router.post("/preview/:id", generatePreview);
router.post("/preview/:token", previewWork);
router.post("/approve/:id", approveWork);

router.put("/:id", assignFreelancer);
router.put("/status/:id", updateJobStatus);

router.delete("/:id", deleteJob);

module.exports = router;
