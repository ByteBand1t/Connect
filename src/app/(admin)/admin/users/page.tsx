import { getAllUsers } from "@/lib/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const roleLabel: Record<string, string> = { OWNER: "Owner", ADMIN: "Admin", MEMBER: "Member" };

export default async function AdminUsersPage() {
  const users = await getAllUsers();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Alle Nutzer</h2>
        <p className="text-sm text-muted-foreground">{users.length} Nutzer registriert</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nutzer</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">E-Mail</th>
                  <th className="text-left px-4 py-3 font-medium">Organisation</th>
                  <th className="text-left px-4 py-3 font-medium">Rolle</th>
                  <th className="text-left px-4 py-3 font-medium">Erstellt</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3">{user.organization.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{roleLabel[user.role] ?? user.role}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(user.createdAt).toLocaleDateString("de-DE")}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Keine Nutzer vorhanden.
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
