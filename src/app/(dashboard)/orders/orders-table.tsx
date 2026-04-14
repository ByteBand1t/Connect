"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  assetName: string;
  createdByName: string | null;
  totalAmount: number | null;
  currency: string;
  createdAt: Date;
}

interface OrdersTableProps {
  orders: Order[];
  statusLabels: Record<string, string>;
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "secondary",
  SUBMITTED: "outline",
  CONFIRMED: "default",
  SHIPPED: "default",
  DELIVERED: "default",
  CANCELLED: "destructive",
};

export function OrdersTable({ orders, statusLabels }: OrdersTableProps) {
  const [search, setSearch] = useState("");

  const filtered = orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.assetName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Input
        placeholder="Bestellnummer oder Asset suchen..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bestellnummer</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Gesamtbetrag</TableHead>
              <TableHead>Erstellt von</TableHead>
              <TableHead>Erstellt am</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    <Link href={`/orders/${order.id}`} className="text-blue-600 hover:underline">
                      {order.orderNumber.slice(0, 8).toUpperCase()}
                    </Link>
                  </TableCell>
                  <TableCell>{order.assetName}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[order.status] ?? "secondary"}>
                      {statusLabels[order.status] ?? order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {order.totalAmount != null
                      ? `${order.totalAmount.toFixed(2)} ${order.currency}`
                      : "—"}
                  </TableCell>
                  <TableCell>{order.createdByName ?? "—"}</TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toLocaleDateString("de-DE")}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-4 text-center text-muted-foreground">
                  Keine Bestellungen gefunden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
