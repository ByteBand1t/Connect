import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Building2, Package, Users, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) redirect("/login");

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || session.user?.email !== adminEmail) redirect("/dashboard");

  const navItems = [
    { name: "Übersicht", href: "/admin", icon: LayoutDashboard },
    { name: "Organisationen", href: "/admin/organizations", icon: Building2 },
    { name: "Alle Assets", href: "/admin/assets", icon: Package },
    { name: "Alle Users", href: "/admin/users", icon: Users },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 text-xl font-bold text-primary">
            <ShieldCheck className="w-5 h-5" />
            Admin
          </div>
          <p className="text-xs text-gray-400 mt-1 truncate">{session.user?.email}</p>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
          <div className="pt-4 border-t mt-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <LayoutDashboard className="w-5 h-5" />
              Zum Dashboard
            </Link>
          </div>
        </nav>
        <div className="p-4 border-t">
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button variant="ghost" className="w-full justify-start gap-3 text-gray-600" type="submit">
              <LogOut className="w-5 h-5" />
              Logout
            </Button>
          </form>
        </div>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center px-8">
          <h1 className="text-lg font-semibold">ConnectAsset Admin</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
