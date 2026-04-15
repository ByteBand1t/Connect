import { getDocumentsByOrganization } from "@/lib/actions/documents";
import DocumentsTable from "@/components/documents/documents-table";

export default async function DocumentsPage() {
  let documents;
  try {
    documents = await getDocumentsByOrganization();
  } catch (error) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-3xl font-bold">Dokumente</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-800 font-medium">Datenbankverbindung fehlgeschlagen</p>
          <p className="text-red-600 text-sm mt-2">Bitte prüfe deine .env Datei und stelle sicher, dass PostgreSQL läuft.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Dokumente</h1>
        <DocumentsTable documents={documents} />
      </div>
    </div>
  );
}
