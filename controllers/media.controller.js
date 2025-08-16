import imagekit from "../utils/imagekit.js";
import Media from "../models/media.model.js";
import Folder from "../models/folder.model.js";
import { AppError } from "../middleware/error.middleware.js";
import { catchAsync } from "../middleware/error.middleware.js";
import fs from "fs/promises";
import { User } from "../models/user.model.js";

// 📥 Upload media
export const uploadMedia = catchAsync(async (req, res) => {
  const { folderId } = req.body;
  if (!folderId) throw new AppError("folderId is required", 400);

  // Verify folder belongs to user
  const folder = await Folder.findOne({ _id: folderId, user: req.user._id });
  if (!folder) throw new AppError("Invalid folder", 400);

  if (!req.files || req.files.length === 0)
    throw new AppError("No files uploaded", 400);

  const user = await User.findById(req.user._id);
  const uploadedMedia = [];

  for (const file of req.files) {
    const fileBuffer = await fs.readFile(file.path);
    const mimeType = file.mimetype;
    const fileSize = file.size; // in bytes

    // 🚨 Storage limit check
    if (user.plan === "free") {
      if (user.storageUsed + fileSize > user.storageLimit) {
        await fs.unlink(file.path);
        throw new AppError("Storage limit exceeded for free plan", 403);
      }
    }

    const uploaded = await imagekit.upload({
      file: fileBuffer,
      fileName: file.originalname,
      folder: folder.name,
    });

    const mediaDoc = await Media.create({
      url: uploaded.url,
      fileType: mimeType.startsWith("image") ? "image" : "pdf",
      folder: folder._id,
      user: req.user._id,
      originalName: file.originalname,
      fileId: uploaded.fileId,
      size: fileSize,
    });

    uploadedMedia.push(mediaDoc);

    // ✅ Update storage usage
    user.storageUsed += fileSize;
    await user.save();

    await fs.unlink(file.path); // cleanup local file
  }

  res.status(201).json({ media: uploadedMedia });
});

// 📂 Get media by folder
export const getMediaByFolder = catchAsync(async (req, res) => {
  const { folderId } = req.params;

  const folder = await Folder.findOne({ _id: folderId, user: req.user._id });
  if (!folder) throw new AppError("Folder not found or unauthorized", 404);

  const media = await Media.find({
    folder: folderId,
    user: req.user._id,
  }).sort({ createdAt: -1 });

  res.json({ media });
});

// 🗑 Delete single media
export const deleteMedia = catchAsync(async (req, res) => {
  const mediaId = req.params.id;

  const media = await Media.findOne({ _id: mediaId, user: req.user._id });
  if (!media) throw new AppError("Media not found or unauthorized", 404);

  try {
    await imagekit.deleteFile(media.fileId);
  } catch (err) {
    console.error("ImageKit delete error:", err?.message || err);
  }

  const user = await User.findById(req.user._id);
  if (user) {
    user.storageUsed = Math.max(0, user.storageUsed - (media.size || 0));
    await user.save();
  }

  await media.deleteOne();

  res.status(200).json({
    message: "Media deleted successfully",
  });
});

// 🗑 Bulk delete
export const bulkDeleteMedia = catchAsync(async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    throw new AppError("Please provide an array of media IDs to delete", 400);
  }

  const mediaDocs = await Media.find({
    _id: { $in: ids },
    user: req.user._id,
  });

  if (mediaDocs.length === 0) {
    throw new AppError("No media found or unauthorized", 404);
  }

  const user = await User.findById(req.user._id);

  await Promise.all(
    mediaDocs.map(async (media) => {
      try {
        await imagekit.deleteFile(media.fileId);
      } catch (err) {
        console.warn("Failed to delete from ImageKit:", err.message);
      }
      await media.deleteOne();

      // ✅ Deduct storage
      if (user) {
        user.storageUsed = Math.max(0, user.storageUsed - (media.size || 0));
      }
    })
  );

  if (user) await user.save();

  res.json({ message: `${mediaDocs.length} media items deleted successfully.` });
});

export const getStorageUsage = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).select('storageUsed storageLimit plan');
  if (!user) throw new AppError('User not found', 404);

  res.json({
    storageUsed: user.storageUsed,
    storageLimit: user.storageLimit,
    plan: user.plan,
    percentageUsed: ((user.storageUsed / user.storageLimit) * 100).toFixed(2),
  });
});