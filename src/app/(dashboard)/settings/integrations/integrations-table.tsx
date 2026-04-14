"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  testSupplierConnection,
  deleteSupplierConfig,
} from "@/lib/actions/integrations";
import { Trash2, Pencil, Plug } from "lucide-react";

interface SupplierConfig {
  id: string;
  name: string;
  adapterId: string;
  isActive: boolean;
  createdAt: Date;
  _count: { submissions: number };
}

interface IntegrationsTableProps {
  configs: SupplierConfig[];
}

const adapterLabels: Record<string, string> = {
  demo: "Demo-Adapter",
  rest: "REST-API",
};

export function IntegrationsTable({ configs }: IntegrationsTableProps) {
  const [testing, setTesting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleTest(id: string, name: string) {
    setTesting(id);
    try {
      const result = await testSupplierConnection(id);
      if (result.success && result.data) {
        const d = result.data;
        if (d.success) {
          toast.success(
            `${name}: ${d.message}${d.latencyMs != null ? ` (${d.latencyMs} ms)` : ""}`
          );
        } else {
          toast.error(`${name}: ${d.message}`);
        }
      } else {
        toast.error(`Fehler: ${result.error}`);
      }
    } finally {
      setTesting(null);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const result = await deleteSupplierConfig(id);
      if (result.success) {
        toast.success("Integration gelöscht.");
      } else {
        toast.error(result.error ?? "Fehler beim Löschen.");
      }
    } finally {
      setDeleting(null);
    }
  }

  if (configs.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        Keine Integrationen konfiguriert. Klicke auf „Neue Integration hinzufügen“.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Adapter</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Übermittlungen</TableHead>
            <TableHead>Erstellt</TableHead>
            <TableHead className="text-right">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {configs.map((cfg) => (
            <TableRow key={cfg.id}>
              <TableCell className="font-medium">{cfg.name}</TableCell>
              <TableCell>
                {adapterLabels[cfg.adapterId] ?? cfg.adapterId}
              </TableCell>
              <TableCell>
                <Badge variant={cfg.isActive ? "default" : "secondary"}>
                  {cfg.isActive ? "Aktiv" : "Inaktiv"}
                </Badge>
              </TableCell>
              <TableCell>{cfg._count.submissions}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {new Date(cfg.createdAt).toLocaleDateString("de-DE")}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(cfg.id, cfg.name)}
                    disabled={testing === cfg.id}
                  >
                    <Plug className="w-3.5 h-3.5" />
                    {testing === cfg.id ? "Teste…" : "Testen"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    render={
                      <Link
                        href={`/settings/integrations/${cfg.id}/edit`}
                      />
                    }
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Bearbeiten
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleting === cfg.id}
                        />
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Löschen
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Integration löschen?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          &bdquo;{cfg.name}&ldquo; wird unwiderruflich gelöscht. Diese
                          Aktion kann nicht rückgängig gemacht werden.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(cfg.id)}
                        >
                          Löschen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
