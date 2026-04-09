import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

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

  // Note: In a real scenario, we would also delete the file from the filesystem here.
  // For this implementation, we focus on the DB record.
  
  await db.document.delete({
    where: { id: documentId },
  });

  revalidatePath(`/assets`);
  return { success: true };
}
