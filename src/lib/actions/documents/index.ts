import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { unlink } from "node:fs/promises";

export async function getDocumentsByAsset(assetId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht autorisiert");

  const documents = await db.document.findMany({
    where: {
      assetId,
      organizationId: session.user.organizationId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return documents;
}

export async function deleteDocument(documentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht autorisiert");

  const document = await db.document.findUnique({
    where: { id: documentId },
  });

  if (!document || document.organizationId !== session.user.organizationId) {
    return { success: false, error: "Dokument nicht gefunden oder Zugriff verweigert" };
  }

  try {
    await unlink(document.filePath);
  } catch (error) {
    console.error("Fehler beim Löschen der Datei vom Filesystem:", error);
    // Wir setzen fort, auch wenn die Datei nicht existiert, um den DB-Eintrag zu bereinigen
  }

  await db.document.delete({
    where: { id: documentId },
  });

  revalidatePath(`/assets`);
  return { success: true };
}

export async function getDocumentsByOrganization() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return await db.document.findMany({
    where: { organizationId: session.user.organizationId },
    include: { asset: { select: { name: true } }, uploadedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

