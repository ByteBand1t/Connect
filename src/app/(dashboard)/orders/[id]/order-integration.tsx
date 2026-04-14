"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  submitOrderToSupplier,
  refreshOrderStatus,
} from "@/lib/actions/integrations";
import { RefreshCw, Send } from "lucide-react";

interface SupplierConfig {
  id: string;
  name: string;
  adapterId: string;
}

interface Submission {
  id: string;
  supplierConfig: { id: string; name: string; adapterId: string };
  externalOrderId: string | null;
  status: string;
  submittedAt: Date;
  errorMessage: string | null;
}

interface OrderIntegrationProps {
  orderId: string;
  supplierConfigs: SupplierConfig[];
  initialSubmissions: Submission[];
}

const statusBadgeVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "secondary",
  SUBMITTED: "outline",
  CONFIRMED: "default",
  PROCESSING: "outline",
  SHIPPED: "default",
  DELIVERED: "default",
  FAILED: "destructive",
  ERROR: "destructive",
  UNKNOWN: "secondary",
};

const statusLabel: Record<string, string> = {
  PENDING: "Ausstehend",
  SUBMITTED: "Übermittelt",
  CONFIRMED: "Bestätigt",
  PROCESSING: "In Bearbeitung",
  SHIPPED: "Versendet",
  DELIVERED: "Geliefert",
  FAILED: "Fehlgeschlagen",
  ERROR: "Fehler",
  UNKNOWN: "Unbekannt",
};

export function OrderIntegration({
  orderId,
  supplierConfigs,
  initialSubmissions,
}: OrderIntegrationProps) {
  const [selectedSupplierId, setSelectedSupplierId] = useState(
    supplierConfigs[0]?.id ?? ""
  );
  const [submissions, setSubmissions] =
    useState<Submission[]>(initialSubmissions);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  async function handleSubmit() {
    if (!selectedSupplierId) {
      toast.error("Bitte einen Hersteller auswählen.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitOrderToSupplier(orderId, selectedSupplierId);
      if (result.success) {
        toast.success(
          result.message ?? "Bestellung erfolgreich übermittelt."
        );
      } else {
        toast.error(
          result.error ??
            result.errors?.join(", ") ??
            "Fehler beim Übermitteln."
        );
      }
      if (result.data) {
        // Refresh submissions list from server – trigger re-render by updating state
        window.location.reload();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRefresh(submissionId: string) {
    setRefreshing(submissionId);
    try {
      const result = await refreshOrderStatus(submissionId);
      if (result.success && result.status) {
        toast.success(
          `Status aktualisiert: ${statusLabel[result.status.status] ?? result.status.status}`
        );
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === submissionId
              ? {
                  ...s,
                  status: result.status!.status,
                }
              : s
          )
        );
      } else {
        toast.error(result.error ?? "Fehler beim Abrufen des Status.");
      }
    } finally {
      setRefreshing(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5" />
          Hersteller-Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {supplierConfigs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Keine aktiven Integrationen konfiguriert. Gehe zu{" "}
            <a
              href="/settings/integrations"
              className="text-blue-600 hover:underline"
            >
              Einstellungen → Integrationen
            </a>
            , um eine hinzuzufügen.
          </p>
        ) : (
          <div className="flex items-center gap-3">
            <select
              className="flex h-9 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-48"
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
            >
              {supplierConfigs.map((cfg) => (
                <option key={cfg.id} value={cfg.id}>
                  {cfg.name}
                </option>
              ))}
            </select>
            <Button onClick={handleSubmit} disabled={submitting}>
              <Send className="w-4 h-4" />
              {submitting ? "Wird übermittelt…" : "Bestellung übermitteln"}
            </Button>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Übermittlungshistorie</h3>
          {submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Übermittlungen.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hersteller</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Externe ID</TableHead>
                    <TableHead>Zeitpunkt</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">
                        {sub.supplierConfig.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            statusBadgeVariant[sub.status] ?? "secondary"
                          }
                        >
                          {statusLabel[sub.status] ?? sub.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {sub.externalOrderId ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(sub.submittedAt).toLocaleString("de-DE")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRefresh(sub.id)}
                          disabled={
                            refreshing === sub.id || !sub.externalOrderId
                          }
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 ${refreshing === sub.id ? "animate-spin" : ""}`}
                          />
                          Status
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
