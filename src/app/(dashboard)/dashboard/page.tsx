import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  CircleX,
  Clock3,
  MoreHorizontal,
  Package,
  PlugZap,
  ShoppingCart,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { getDashboardData } from "@/lib/actions/dashboard";
import { getRelativeTime } from "@/lib/date-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { StatusDonutChart } from "./status-donut-chart";

const statusMeta = {
  GREEN: {
    label: "Green",
    subtitle: "No immediate maintenance required",
    className: "border-green-200 bg-green-50/70 text-green-900",
    badgeClassName: "bg-green-100 text-green-800 border-green-200",
    color: "#22c55e",
    Icon: CheckCircle2,
  },
  YELLOW: {
    label: "Yellow",
    subtitle: "Maintenance due in ≤ 30 days",
    className: "border-yellow-200 bg-yellow-50/70 text-yellow-900",
    badgeClassName: "bg-yellow-100 text-yellow-800 border-yellow-200",
    color: "#eab308",
    Icon: AlertTriangle,
  },
  RED: {
    label: "Red",
    subtitle: "Maintenance overdue",
    className: "border-red-200 bg-red-50/70 text-red-900",
    badgeClassName: "bg-red-100 text-red-800 border-red-200",
    color: "#ef4444",
    Icon: CircleX,
  },
} as const;

const typeLabels: Record<string, string> = {
  MACHINE: "Machine",
  VEHICLE: "Vehicle",
  IT_EQUIPMENT: "IT equipment",
  OFFICE_EQUIPMENT: "Office equipment",
  FACILITY: "Facility",
  OTHER: "Other",
};

function formatDate(date: Date | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const data = await getDashboardData();

  const donutData = [
    { name: "Green", value: data.assetCounts.GREEN, color: statusMeta.GREEN.color },
    { name: "Yellow", value: data.assetCounts.YELLOW, color: statusMeta.YELLOW.color },
    { name: "Red", value: data.assetCounts.RED, color: statusMeta.RED.color },
  ];

  const orderSummary = [
    { label: "Drafts", count: data.orderCounts.DRAFT, badge: "bg-slate-100 text-slate-800 border-slate-200" },
    { label: "Submitted", count: data.orderCounts.SUBMITTED, badge: "bg-blue-100 text-blue-800 border-blue-200" },
    {
      label: "In progress",
      count: data.orderCounts.CONFIRMED + data.orderCounts.SHIPPED,
      badge: "bg-amber-100 text-amber-800 border-amber-200",
    },
    { label: "Completed", count: data.orderCounts.DELIVERED, badge: "bg-green-100 text-green-800 border-green-200" },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your central command view for assets, maintenance, and orders.</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" />}>
            <MoreHorizontal />
            Quick actions
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem render={<Link href="/assets/new" />}>Create new asset</DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/orders/new" />}>Create new order</DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/assets?status=RED" />}>Log maintenance</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {(["GREEN", "YELLOW", "RED"] as const).map((status) => {
          const item = statusMeta[status];
          const Icon = item.Icon;

          return (
            <Link key={status} href={`/assets?status=${status}`}>
              <Card className={`h-full border transition hover:shadow-sm ${item.className}`}>
                <CardHeader className="pb-2">
                  <CardDescription className="text-current/80">Asset status</CardDescription>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{item.label}</CardTitle>
                    <Icon className="size-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-semibold">{data.assetCounts[status]}</div>
                  <p className="mt-2 text-xs text-current/80">{item.subtitle}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Asset status distribution</CardTitle>
            <CardDescription>Green / Yellow / Red ratio for your fleet.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.totalAssets === 0 ? (
              <div className="space-y-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                <p>No assets yet. Create your first asset to see status analytics.</p>
                <Button render={<Link href="/assets/new" />} size="sm">
                  Create asset
                </Button>
              </div>
            ) : (
              <>
                <StatusDonutChart data={donutData} total={data.totalAssets} />
                <Separator />
                <div className="space-y-2 text-sm">
                  {donutData.map((item) => {
                    const percentage = data.totalAssets > 0 ? Math.round((item.value / data.totalAssets) * 100) : 0;
                    return (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span>{item.name}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {item.value} ({percentage}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance timeline</CardTitle>
            <CardDescription>Next 10 due or overdue maintenance events.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.upcomingMaintenance.length === 0 ? (
              <p className="text-sm text-muted-foreground">All assets are in the green range.</p>
            ) : (
              <div className="space-y-3">
                {data.upcomingMaintenance.map((asset) => {
                  const dueDate = asset.nextMaintenanceDate;
                  const isOverdue = dueDate ? dueDate.getTime() < Date.now() : false;
                  return (
                    <div key={asset.id} className={`rounded-md border p-3 ${isOverdue ? "border-red-200 bg-red-50/50" : ""}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link href={`/assets/${asset.id}`} className="font-medium hover:underline">
                            {asset.name}
                          </Link>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge variant="outline">{typeLabels[asset.type] ?? asset.type}</Badge>
                            <Badge variant="outline" className={statusMeta[asset.status].badgeClassName}>
                              {asset.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <div>{formatDate(dueDate)}</div>
                          <div className={isOverdue ? "font-medium text-red-700" : ""}>
                            {dueDate ? (isOverdue ? `${getRelativeTime(dueDate)} overdue` : getRelativeTime(dueDate)) : "No due date"}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders overview</CardTitle>
            <CardDescription>Current pipeline and latest activity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {orderSummary.map((summary) => (
                <div key={summary.label} className="rounded-md border p-2">
                  <p className="text-xs text-muted-foreground">{summary.label}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-lg font-semibold">{summary.count}</span>
                    <Badge variant="outline" className={summary.badge}>
                      {summary.label}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {data.recentOrders.length === 0 ? (
              <div className="space-y-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                <p>No orders yet. Create your first order.</p>
                <Button render={<Link href="/orders/new" />} size="sm">
                  Create order
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {data.recentOrders.map((order) => (
                  <Link key={order.id} href={`/orders/${order.id}`} className="block rounded-md border p-3 hover:bg-muted/50">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">#{order.orderNumber}</p>
                        <p className="text-xs text-muted-foreground">{order.asset.name}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{order.status}</Badge>
                        <p className="mt-1 text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <Button render={<Link href="/orders" />} variant="outline" size="sm">
              All orders <ChevronRight />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supplier integrations status</CardTitle>
            <CardDescription>Health of active supplier channels.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Active integrations</p>
                <p className="text-2xl font-semibold">{data.activeIntegrations}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Open submissions</p>
                <p className="text-2xl font-semibold">{data.openSubmissions}</p>
              </div>
              <div className={`rounded-md border p-3 ${data.failedSubmissions > 0 ? "border-red-200 bg-red-50/70" : ""}`}>
                <p className="text-xs text-muted-foreground">Failed submissions</p>
                <p className={`text-2xl font-semibold ${data.failedSubmissions > 0 ? "text-red-700" : ""}`}>{data.failedSubmissions}</p>
              </div>
            </div>

            {data.activeIntegrations === 0 ? (
              <p className="text-sm text-muted-foreground">No supplier integrations configured.</p>
            ) : null}

            <Button render={<Link href="/settings/integrations" />} variant="outline" size="sm">
              Manage integrations <ChevronRight />
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity feed</CardTitle>
          <CardDescription>Latest 10 organization events.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activities yet.</p>
          ) : (
            <div className="space-y-3">
              {data.recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 rounded-md border p-3">
                  <div className="mt-0.5 rounded-full bg-muted p-1.5">
                    {activity.entityType === "Asset" ? <Package className="size-4" /> : activity.entityType === "Order" ? <ShoppingCart className="size-4" /> : <PlugZap className="size-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{activity.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      by {activity.user.name} • {getRelativeTime(activity.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock3 className="size-3" />
                    {formatDate(activity.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
