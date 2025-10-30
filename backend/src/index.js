require("dotenv").config();
require("./config/db.config").connectDB();
const path = require("node:path");
const express = require("express");
const corsMidlleware = require("./middlewares/cors.middleware");
const globalErrorHandler = require("./middlewares/error-handeler.middleware");
const AppError = require("./utils/error.utils");
const logger = require("./utils/logger.utils");
const PORT = process.env.PORT;
const app = express();

// Middlewares
app.use(corsMidlleware);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// API routes
app.use("/api/jobs", require("./routes/job.route"));
app.use("/api/comments", require("./routes/comments.route"));

// Handle errors
app.use((req, res, next) => {
  next(new AppError(`Can not find ${req.originalUrl} on this server`, 404));
});
app.use(globalErrorHandler);

app.listen(PORT, (err) => {
  if (err) {
    logger.error(`Listening server error: ${err.message}`);
  } else {
    console.log(`Server listens at port: ${PORT}`);
  }
});
