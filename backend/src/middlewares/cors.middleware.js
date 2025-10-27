const cors = require("cors");
const AppError = require("../utils/error.utils");

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : [];

const isDev = process.env.NODE_ENV === "development";

const corsOptions = {
  origin: function (origin, cb) {
    if (isDev) return cb(null, true);
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) {
      return cb(null, true);
    } else {
      return cb(new AppError(`CORS policy: ${origin} not allowed`, 400));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Authorization", "X-Total-Count"], // front can read this headers
  maxAge: 86400, // cache preflight response for 1 day
};

module.exports = cors(corsOptions);
