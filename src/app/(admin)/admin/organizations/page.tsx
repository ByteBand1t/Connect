import { getAllOrganizations } from "@/lib/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminOrganizationsPage() {
  const orgs = await getAllOrganizations();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Organisationen</h2>
        <p className="text-sm text-muted-foreground">{orgs.length} Organisationen registriert</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alle Organisationen</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Typ</th>
                  <th className="text-left px-4 py-3 font-medium">Slug</th>
                  <th className="text-right px-4 py-3 font-medium">Nutzer</th>
                  <th className="text-right px-4 py-3 font-medium">Assets</th>
                  <th className="text-right px-4 py-3 font-medium">Bestellungen</th>
                  <th className="text-left px-4 py-3 font-medium">Erstellt</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((org) => (
                  <tr key={org.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{org.name}</td>
                    <td className="px-4 py-3">
                      {org.type ? (
                        <Badge variant="outline">
                          {org.type === "OPERATOR" ? "Betreiber" : "Anbieter"}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">–</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{org.slug}</td>
                    <td className="px-4 py-3 text-right">{org._count.users}</td>
                    <td className="px-4 py-3 text-right">{org._count.assets}</td>
                    <td className="px-4 py-3 text-right">{org._count.orders}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(org.createdAt).toLocaleDateString("de-DE")}
                    </td>
                  </tr>
                ))}
                {orgs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      Keine Organisationen vorhanden.
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
