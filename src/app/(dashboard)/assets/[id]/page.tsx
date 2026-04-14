import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAsset } from "@/lib/actions/assets";
import { calculateAssetStatus } from "@/lib/asset-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Edit, Calendar, Info, Tag } from "lucide-react";
import { DocumentHub } from "@/components/document-hub";
import { DeleteAssetButton } from "./delete-asset-button";
import { getDocumentsByAsset } from "@/lib/actions/documents";

export default async function AssetDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const asset = await getAsset(params.id);
  if (!asset) {
    return <div className="p-8 text-center">Asset nicht gefunden.</div>;
  }

  const documents = await getDocumentsByAsset(asset.id);

  const status = calculateAssetStatus(asset);
  const statusColorMap: Record<"GREEN" | "YELLOW" | "RED", string> = {
    GREEN: "bg-green-500",
    YELLOW: "bg-yellow-500",
    RED: "bg-red-500",
  };
  const statusColor = statusColorMap[status as keyof typeof statusColorMap];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{asset.name}</h1>
          <p className="text-muted-foreground">Asset-ID: {asset.id}</p>
        </div>
        <div className="flex gap-3">
          <Button render={<Link href={`/assets/${asset.id}/edit`} />} variant="outline">
            <Edit className="w-4 h-4" /> Bearbeiten
          </Button>
          <DeleteAssetButton assetId={asset.id} assetName={asset.name} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="w-5 h-5" /> Allgemeine Infos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow label="Typ" value={asset.type} />
            <DetailRow label="Hersteller" value={asset.manufacturer} />
            <DetailRow label="Modell" value={asset.model} />
            <DetailRow label="Seriennummer" value={asset.serialNumber} />
            <DetailRow label="Standort" value={asset.location} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5" /> Wartung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center p-4 bg-zinc-50 rounded-lg border">
              <div className={`w-12 h-12 rounded-full ${statusColor} mb-2 shadow-inner`} />
              <span className="font-bold uppercase">{status}</span>
            </div>
            <div className="space-y-4">
              <DetailRow label="Letzte Wartung" value={asset.lastMaintenanceDate?.toLocaleDateString()} />
              <DetailRow label="Nächste Wartung" value={asset.nextMaintenanceDate?.toLocaleDateString()} />
              <DetailRow label="Intervall (Tage)" value={asset.maintenanceIntervalDays?.toString()} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Tag className="w-5 h-5" /> Kauf & Notizen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <DetailRow label="Kaufdatum" value={asset.purchaseDate?.toLocaleDateString()} />
              <DetailRow label="Garantie bis" value={asset.warrantyUntil?.toLocaleDateString()} />
            </div>
            <div className="pt-4 border-t">
              <label className="text-sm font-medium text-muted-foreground">Notizen</label>
              <p className="mt-1 text-sm text-zinc-700 whitespace-pre-wrap">
                {asset.notes || "Keine Notizen vorhanden."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <DocumentHub assetId={asset.id} documents={documents} />
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-zinc-100 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || "-"}</span>
    </div>
  );
}
