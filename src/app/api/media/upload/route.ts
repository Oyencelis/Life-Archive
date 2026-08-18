import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadMedia, getSignedMediaUrl, MAX_UPLOAD_BYTES } from "@/lib/storage/media";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File is larger than 20MB" }, { status: 413 });
  }

  try {
    const media = await uploadMedia(session.user.id, file);
    const row = await prisma.media.findUniqueOrThrow({ where: { id: media.id } });
    const url = await getSignedMediaUrl(row.storageKey);
    return NextResponse.json({ ...media, url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    const status = message.startsWith("Unsupported file type") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
