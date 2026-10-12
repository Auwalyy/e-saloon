/**
 * Uploaded images stored directly in MongoDB (binary).
 * Files are small (validated on upload) and served through GET /api/media/:id,
 * so no external storage service is required.
 */
const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    filename: { type: String, trim: true, maxlength: 200 },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true, select: false },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Media', mediaSchema);
