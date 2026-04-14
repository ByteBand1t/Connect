import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getOrder } from "@/lib/actions/orders";
import { getSupplierConfigs, getOrderSubmissions } from "@/lib/actions/integrations";
import { OrderIntegration } from "./order-integration";
import { ArrowLeft, ShoppingCart, Package } from "lucide-react";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  DRAFT: "Entwurf",
  SUBMITTED: "Eingereicht",
  CONFIRMED: "Bestätigt",
  SHIPPED: "Versendet",
  DELIVERED: "Geliefert",
  CANCELLED: "Storniert",
};

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  DRAFT: "secondary",
  SUBMITTED: "outline",
  CONFIRMED: "default",
  SHIPPED: "default",
  DELIVERED: "default",
  CANCELLED: "destructive",
};

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [orderResult, configsResult, submissionsResult] = await Promise.all([
    getOrder(params.id),
    getSupplierConfigs(),
    getOrderSubmissions(params.id),
  ]);

  if (!orderResult.success || !orderResult.data) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Bestellung nicht gefunden.
      </div>
    );
  }

  const order = orderResult.data;
  const activeConfigs = (
    (configsResult.data ?? []) as Array<{
      id: string;
      name: string;
      adapterId: string;
      isActive: boolean;
    }>
  ).filter((c) => c.isActive);
  const submissions = (submissionsResult.data ?? []) as {
    id: string;
    supplierConfig: { id: string; name: string; adapterId: string };
    externalOrderId: string | null;
    status: string;
    submittedAt: Date;
    errorMessage: string | null;
  }[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/orders" />}
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ShoppingCart className="w-7 h-7" />
              Bestellung #{order.orderNumber.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Erstellt am{" "}
              {new Date(order.createdAt).toLocaleDateString("de-DE")} von{" "}
              {order.createdBy.name}
            </p>
          </div>
        </div>
        <Badge variant={statusVariant[order.status] ?? "secondary"}>
          {statusLabels[order.status] ?? order.status}
        </Badge>
      </div>

      {/* Order details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="w-4 h-4" />
              Bestellinformationen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Bestellnummer" value={order.orderNumber} />
            <DetailRow label="Asset" value={order.asset.name} />
            <DetailRow label="Erstellt von" value={order.createdBy.name} />
            <DetailRow
              label="Organisation"
              value={order.organization.name}
            />
            <DetailRow label="Währung" value={order.currency} />
            {order.notes && (
              <DetailRow label="Notizen" value={order.notes} />
            )}
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Zusammenfassung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Anzahl Positionen" value={String(order.items.length)} />
            <DetailRow
              label="Gesamtbetrag"
              value={
                order.totalAmount != null
                  ? `${order.totalAmount.toFixed(2)} ${order.currency}`
                  : "—"
              }
            />
            <DetailRow
              label="Aktualisiert"
              value={new Date(order.updatedAt).toLocaleDateString("de-DE")}
            />
          </CardContent>
        </Card>
      </div>

      {/* Order items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bestellpositionen</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Artikelnummer</TableHead>
                <TableHead>Bezeichnung</TableHead>
                <TableHead className="text-right">Menge</TableHead>
                <TableHead className="text-right">Einzelpreis</TableHead>
                <TableHead className="text-right">Gesamt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-4 text-muted-foreground"
                  >
                    Keine Positionen
                  </TableCell>
                </TableRow>
              ) : (
                order.items.map((item: { id: string; partNumber: string; name: string; quantity: number; unitPrice: number | null; totalPrice: number | null }) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">
                      {item.partNumber}
                    </TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-right">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.unitPrice != null
                        ? `${item.unitPrice.toFixed(2)} ${order.currency}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.totalPrice != null
                        ? `${item.totalPrice.toFixed(2)} ${order.currency}`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Integration section */}
      <OrderIntegration
        orderId={order.id}
        supplierConfigs={activeConfigs.map((c) => ({
          id: c.id,
          name: c.name,
          adapterId: c.adapterId,
        }))}
        initialSubmissions={submissions}
      />
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-zinc-100 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}
