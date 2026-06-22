import { NextResponse } from "next/server";
import { uploadAvatarBuffer } from "@/lib/cloudinary";

const MAX_BYTES = 2 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image." }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image must be under 2 MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadAvatarBuffer(buffer, file.name);

    return NextResponse.json({ url });
  } catch (e) {
    console.error("avatar upload", e);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
