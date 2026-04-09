import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;
  // In a real scenario, we would fetch the organization name using the organizationId from the session
  // For now, we'll use a placeholder or the user's name if org name is not in session
  const orgName = (user as any).organizationName || "My Organization";

  const modules = [
    { title: "Assets", description: "Manage your hardware and software assets", color: "bg-blue-100 text-blue-700" },
    { title: "Bestellungen", description: "Track and manage supply chain orders", color: "bg-green-100 text-green-700" },
    { title: "Dokumente", description: "Central repository for technical docs", color: "bg-purple-100 text-purple-700" },
    { title: "Dashboard", description: "Overview of your system status", color: "bg-orange-100 text-orange-700" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Willkommen, {user.name}!</h1>
        <p className="text-muted-foreground">Organisation: {orgName}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {modules.map((module) => (
          <Card key={module.title} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-lg">{module.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{module.description}</p>
              <div className={`mt-4 h-2 w-full rounded-full ${module.color.split(' ')[0]}`} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
