const express = require("express");
const { upload } = require("../controllers/work.controller");
const multer = require("../middlewares/upload.middleware");
const router = express.Router();

router.post("/", multer.single("file"), upload);

module.exports = router;
