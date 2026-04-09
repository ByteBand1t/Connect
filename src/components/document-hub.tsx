"use client";

import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { 
  FileText, 
  Download, 
  Trash2, 
  ExternalLink 
} from "lucide-react";
import { deleteDocument } from "@/lib/actions/documents";
import { useRouter } from "next/navigation";
import { DocumentUploadDialog } from "./document-upload-dialog";

interface DocumentHubProps {
  assetId: string;
  documents: any[];
}

export function DocumentHub({ assetId, documents }: DocumentHubProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<{ id: string, name: string } | null>(null);
  const router = useRouter();

  async function handleDelete(id: string, name: string) {
    setDeletingId(id);
    const res = await deleteDocument(id);
    if (res.success) {
      router.refresh();
    } else {
      alert(res.error || "Fehler beim Löschen");
    }
    setDeletingId(null);
  }

  const categoryMap: Record<string, string> = {
    MANUAL: "Handbuch",
    SCHEMATIC: "Schaltplan",
    MAINTENANCE_REPORT: "Wartungsbericht",
    WARRANTY: "Garantie",
    INVOICE: "Rechnung",
    CERTIFICATE: "Zertifikat",
    OTHER: "Sonstiges",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Dokumenten-Hub</h2>
          <p className="text-sm text-muted-foreground">Verwalten Sie alle Dokumente für dieses Asset</p>
        </div>
        <DocumentUploadDialog assetId={assetId} onSuccess={() => router.refresh()} />
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Kategorie</TableHead>
              <TableHead>Größe</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  Keine Dokumente hochgeladen.
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      {doc.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{categoryMap[doc.category] || doc.category}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {(doc.fileSize / 1024).toFixed(1)} KB
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <a href={`/api/documents/download?id=${doc.id}`} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive" 
                        onClick={() => setIsDeleteDialogOpen({ id: doc.id, name: doc.name })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!isDeleteDialogOpen} onOpenChange={(open) => {
        if (!open) setIsDeleteDialogOpen(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dokument löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie das Dokument <strong className="font-semibold">{isDeleteDialogOpen?.name}</strong> wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => isDeleteDialogOpen && handleDelete(isDeleteDialogOpen.id, isDeleteDialogOpen.name)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingId === isDeleteDialogOpen?.id ? "Lösche..." : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
