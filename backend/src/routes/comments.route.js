const express = require("express");
const {
  getJobComments,
  createComment,
} = require("../controllers/comments.controller");
const router = express.Router();

router.get("/:id", getJobComments);
router.post("/:id", createComment);

module.exports = router;
