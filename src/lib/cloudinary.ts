import { v2 as cloudinary } from "cloudinary";

cloudinary.config({ secure: true });

export async function uploadAvatarBuffer(
  buffer: Buffer,
  filename: string
): Promise<string> {
  if (!process.env.CLOUDINARY_URL) {
    throw new Error("CLOUDINARY_URL is not configured");
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "bundlehub/avatars",
        public_id: `avatar_${Date.now()}`,
        resource_type: "image",
        transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }]
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error ?? new Error("Upload failed"));
          return;
        }
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}
