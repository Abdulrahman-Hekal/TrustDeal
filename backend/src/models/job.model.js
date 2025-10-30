const mongoose = require("mongoose");
const crypto = require("node:crypto");

const ENCRYPTION_ALGO = "aes-256-cbc";
const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(process.env.DATA_ENCRYPTION_SECRET)
  .digest(); // must be 32 bytes
const IV_LENGTH = 16;

// ---------- Helpers ----------

function encrypt(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGO, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  return iv.toString("base64") + ":" + encrypted;
}

function decrypt(data) {
  if (!data) return data;
  const [ivBase64, encrypted] = data.split(":");
  const iv = Buffer.from(ivBase64, "base64");
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGO, ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encrypted, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// ---------- Schema ----------

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // Encrypted fields
    clientAddress: {
      type: String,
      required: true,
      set: encrypt,
      get: decrypt,
    },
    freelancerAddress: {
      type: String,
      required: true,
      default: "",
      set: encrypt,
      get: decrypt,
    },

    previewHash: {
      type: String, // IPFS CID of the preview
      required: true,
      default: "",
      set: encrypt,
      get: decrypt,
    },
    finalHash: {
      type: String, // IPFS CID of the final deliverable
      required: true,
      default: "",
      set: encrypt,
      get: decrypt,
    },

    // Encryption metadata (encrypted for safety)
    encryptedFilePath: {
      type: String,
      required: true,
      default: "",
      set: encrypt,
      get: decrypt,
    },
    key: {
      type: String,
      required: true,
      default: "",
      set: encrypt,
      get: decrypt,
    },
    iv: {
      type: String,
      required: true,
      default: "",
      set: encrypt,
      get: decrypt,
    },
    authTag: {
      type: String,
      required: true,
      default: "",
      set: encrypt,
      get: decrypt,
    },
    mimetype: {
      type: String,
      required: true,
      default: "",
      set: encrypt,
      get: decrypt,
    },

    deliveryDeadline: { type: Number, required: true },
    approvalDeadline: { type: Number, required: true },

    status: {
      type: String,
      enum: ["pending", "funded", "deliverd", "approved", "refunded"],
      default: "pending",
    },

    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// ---------- Indexes ----------
jobSchema.index({ clientAddress: 1 });
jobSchema.index({ freelancerAddress: 1 });
jobSchema.index({ status: 1 });

// ---------- Virtuals ----------
jobSchema.virtual("isExpired").get(function () {
  return Date.now() > this.deliveryDeadline;
});

module.exports = mongoose.model("Job", jobSchema);
