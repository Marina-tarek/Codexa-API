import multer from "multer";
import path from "path";
import cloudinary from "../utils/cloudinary.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const storageMode = process.env.STORAGE_MODE || "cloudinary";

let uploadProfile;
let uploadVideo;

if (storageMode === "cloudinary") {
  const imageStorage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "course_platform/profile_images",
      resource_type: "image",
      allowed_formats: ["jpg", "png", "jpeg"],
    },
  });

  const videoStorage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "course_platform/videos",
      resource_type: "video",
    },
  });

  uploadProfile = multer({ storage: imageStorage });
  uploadVideo = multer({ storage: videoStorage });
} else {
  const storage = multer.diskStorage({
    destination(req, file, cb) {
      if (file.fieldname === "profileImage") cb(null, "uploads/profiles/");
      else cb(null, "uploads/videos/");
    },
    filename(req, file, cb) {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });

  const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.fieldname === "profileImage") {
      if ([".png", ".jpg", ".jpeg"].includes(ext)) cb(null, true);
      else cb(new Error("Images only"));
    } else {
      if ([".mp4", ".mov", ".avi", ".mkv"].includes(ext)) cb(null, true);
      else cb(new Error("Videos only"));
    }
  };

  const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 800 * 1024 * 1024 },
  });

  uploadProfile = upload.single("profileImage");
  uploadVideo = upload.single("video");
}

// ✅ exports must be top-level
export { uploadProfile, uploadVideo };
