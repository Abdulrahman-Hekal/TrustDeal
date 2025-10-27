const mongoose = require("mongoose");
const logger = require("../utils/logger.utils");

exports.connectDB = async () => {
  try {
    const con = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Mongo DB Connected at Host: ${con.connection.host}`);
  } catch (err) {
    logger.error(`Connecting to DB error: ${err.message}`);
    process.exit(1);
  }
};
