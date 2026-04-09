import { getDocumentsByOrganization } from "@/lib/actions/documents";
import { DocumentsTable } from "@/components/documents/documents-table";

export default async function DocumentsPage() {
  const documents = await getDocumentsByOrganization();

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Dokumente</h1>
        <DocumentsTable documents={documents} />
      </div>
    </div>
  );
}
