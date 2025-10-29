const fs = require("node:fs");
const crypto = require("node:crypto");
const path = require("node:path");
const jwt = require("jsonwebtoken");

const ALGORITHM = "aes-256-gcm";
const PREVIEW_EXPIRATION = "10m"; // 10 minutes validity for JWT
const TEMP_FOLDER = path.join(__dirname, "./temp");

// Ensure temp directory exists
if (!fs.existsSync(TEMP_FOLDER)) fs.mkdirSync(TEMP_FOLDER, { recursive: true });

/**
 * Generate a short-lived preview token
 */
exports.createPreviewToken = (fileId, userId) => {
  return jwt.sign({ fileId, userId }, process.env.JWT_SECRET, {
    expiresIn: PREVIEW_EXPIRATION,
  });
};

/**
 * Verify token and return payload
 */
exports.verifyPreviewToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
};

/**
 * Serve file stream as inline (no download)
 */
exports.streamAsInline = (filePath, contentType, res) => {
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Disposition", "inline"); // prevents download
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
};

/**
 * Example: handle preview route (use in Express)
 */
// import express from "express";
// const app = express();

// app.get("/preview/:token", async (req, res) => {
//   const payload = verifyPreviewToken(req.params.token);
//   if (!payload) return res.status(403).json({ error: "Invalid or expired token" });

//   const fileId = payload.fileId;
//   const fileInfo = await getFileInfoFromDB(fileId); // your DB logic

//   try {
//     const tempFile = await decryptToTemp(fileInfo.path, fileInfo.key, fileInfo.iv);
//     const mimeType = getMimeType(tempFile); // e.g. "image/jpeg"
//     streamAsInline(tempFile, mimeType, res);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Preview failed" });
//   }
// });

/**
 * Detect MIME type from extension (simple helper)
 */
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext))
    return "image/jpeg";
  if ([".mp4", ".mov", ".avi"].includes(ext)) return "video/mp4";
  if ([".mp3", ".wav", ".ogg"].includes(ext)) return "audio/mpeg";
  if ([".pdf"].includes(ext)) return "application/pdf";
  if ([".doc", ".docx"].includes(ext))
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return "application/octet-stream";
}

// Encrypts a file using AES-256-GCM.
exports.encryptFile = async (filePath) => {
  const algorithm = "aes-256-gcm";

  // Generate random key & IV
  const key = crypto.randomBytes(32); // 256-bit key
  const iv = crypto.randomBytes(12); // 96-bit IV (recommended for GCM)

  // Prepare paths
  const outputPath = `${filePath}.enc`;

  // Create cipher
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  // Read, encrypt, write
  const input = fs.createReadStream(filePath);
  const output = fs.createWriteStream(outputPath);

  await new Promise((resolve, reject) => {
    input.pipe(cipher).pipe(output).on("finish", resolve).on("error", reject);
  });

  // Collect auth tag (integrity check)
  const authTag = cipher.getAuthTag();

  // Return useful metadata
  return {
    outputPath,
    key: key.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
};

// Decrypts a file encrypted with AES-256-GCM.
exports.decryptFile = async (
  encryptedPath,
  keyBase64,
  ivBase64,
  authTagBase64,
  outputPath
) => {
  const algorithm = "aes-256-gcm";
  const key = Buffer.from(keyBase64, "base64");
  const iv = Buffer.from(ivBase64, "base64");
  const authTag = Buffer.from(authTagBase64, "base64");

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);

  const input = fs.createReadStream(encryptedPath);
  const output = fs.createWriteStream(outputPath);

  await new Promise((resolve, reject) => {
    input.pipe(decipher).pipe(output).on("finish", resolve).on("error", reject);
  });

  return outputPath;
};

/**
 * Decrypt file to a temporary path (for preview only)
 */
exports.tempDecrypt = async (
  encryptedPath,
  keyBase64,
  ivBase64,
  authTagBase64
) => {
  const algorithm = "aes-256-gcm";
  const key = Buffer.from(keyBase64, "base64");
  const iv = Buffer.from(ivBase64, "base64");
  const authTag = Buffer.from(authTagBase64, "base64");

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);

  const input = fs.createReadStream(encryptedPath);
  const tempPath = path.join(
    TEMP_FOLDER,
    `temp-${path.basename(encryptedPath, ".enc")}`
  );
  const output = fs.createWriteStream(tempPath);

  input.pipe(decipher).pipe(output);

  return new Promise((resolve, reject) => {
    output.on("finish", () => {
      // Auto-delete after 2 minutes
      setTimeout(
        () => fs.existsSync(tempPath) && fs.unlinkSync(tempPath),
        2 * 60 * 1000
      );
      resolve(tempPath);
    });
    output.on("error", reject);
  });
};
