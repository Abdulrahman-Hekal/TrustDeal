const logger = require("../utils/logger.utils");

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  logger.error(
    `Error occured [${req.method} - ${req.originalUrl}] : ${err.message}`,
    {
      stack: err.stack,
      statusCode: err.statusCode,
    }
  );

  if (process.env.NODE_ENV === "development") {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    return res.status(500).json({
      status: "error",
      message: "Somthing went wrong please try again later",
    });
  }
};
