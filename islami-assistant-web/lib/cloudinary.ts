import { v2 as cloudinary } from "cloudinary";

let configured = false;

function ensureCloudinaryConfigured() {
  if (configured) return;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary env vars are missing");
  }
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  configured = true;
}

type UploadKind = "image" | "pdf";

export async function uploadFinanceFileToCloudinary(file: File) {
  ensureCloudinaryConfigured();
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const kind: UploadKind = ext === "pdf" ? "pdf" : "image";
  const resourceType = kind === "pdf" ? "raw" : "image";
  const folder = kind === "pdf" ? "islami-assistant/finance/pdf" : "islami-assistant/finance/images";

  const bytes = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type || "application/octet-stream"};base64,${bytes.toString("base64")}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: resourceType,
    use_filename: true,
    unique_filename: true,
    overwrite: false,
  });

  return {
    secureUrl: result.secure_url,
    kind,
  };
}
