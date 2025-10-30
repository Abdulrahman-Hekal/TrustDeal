const Comment = require("../models/comments.model");
const catchAsync = require("../utils/catch-async.utils");

exports.getJobComments = catchAsync(async (req, res) => {
  const comments = await Comment.find({ jobId: req.params.id });

  res.json({
    message: "Get Comments",
    data: comments,
  });
});

exports.createComment = catchAsync(async (req, res) => {
  const { content, freelancerAddress } = req.body;
  const comment = await Comment.create({
    jobId: req.params.id,
    content,
    freelancerAddress,
  });

  res.json({
    message: "Your comment created successfully",
    data: comment,
  });
});
