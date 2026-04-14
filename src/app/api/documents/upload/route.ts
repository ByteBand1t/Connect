import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const DOCUMENT_CATEGORIES = [
  "MANUAL",
  "SCHEMATIC",
  "MAINTENANCE_REPORT",
  "WARRANTY",
  "INVOICE",
  "CERTIFICATE",
  "OTHER",
] as const;
type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string | null;
    const category = formData.get("category") as string | null;
    const assetId = formData.get("assetId") as string | null;

    if (!file || !name || !category || !assetId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Max 20MB." }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
    }

    if (!DOCUMENT_CATEGORIES.includes(category as DocumentCategory)) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    // Validate Asset and Organization
    const asset = await db.asset.findUnique({
      where: { id: assetId },
      select: { organizationId: true },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    if (asset.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const organizationId = asset.organizationId;
    const userId = session.user.id;

    // File storage path: ./uploads/[organizationId]/[assetId]/[timestamp]-[filename]
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const uploadDir = join(process.cwd(), "uploads", organizationId, assetId);
    const filePath = join(uploadDir, fileName);

    await mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Create DB entry
    const document = await db.document.create({
      data: {
        name,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        filePath: filePath,
        category: category as DocumentCategory,
        assetId,
        uploadedById: userId,
        organizationId,
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
