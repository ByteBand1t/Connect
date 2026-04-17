import { getAllAssets } from "@/lib/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const statusLabel: Record<string, string> = { GREEN: "OK", YELLOW: "Wartung fällig", RED: "Kritisch" };
const statusVariant: Record<string, string> = { GREEN: "bg-green-100 text-green-800", YELLOW: "bg-yellow-100 text-yellow-800", RED: "bg-red-100 text-red-800" };

export default async function AdminAssetsPage() {
  const assets = await getAllAssets();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Alle Assets</h2>
        <p className="text-sm text-muted-foreground">{assets.length} Assets plattformweit</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assets</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Typ</th>
                  <th className="text-left px-4 py-3 font-medium">Hersteller</th>
                  <th className="text-left px-4 py-3 font-medium">Organisation</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Erstellt</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{asset.name}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{asset.type}</td>
                    <td className="px-4 py-3">{asset.manufacturer}</td>
                    <td className="px-4 py-3 text-muted-foreground">{asset.organization.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusVariant[asset.status]}`}>
                        {statusLabel[asset.status] ?? asset.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(asset.createdAt).toLocaleDateString("de-DE")}
                    </td>
                  </tr>
                ))}
                {assets.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Keine Assets vorhanden.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
