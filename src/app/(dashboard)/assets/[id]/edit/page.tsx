"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateAsset, getAsset } from "@/lib/actions/assets";
import { useRouter, useParams } from "next/navigation";

const assetSchema = z.object({
  name: z.string().min(2, "Name is required"),
  type: z.enum(["MACHINE", "VEHICLE", "IT_EQUIPMENT", "OFFICE_EQUIPMENT", "FACILITY", "OTHER"]),
  manufacturer: z.string().min(2, "Manufacturer is required"),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(["GREEN", "YELLOW", "RED"]),
  purchaseDate: z.string().optional(),
  warrantyUntil: z.string().optional(),
  maintenanceIntervalDays: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

type AssetFormValues = z.infer<typeof assetSchema>;

export default function EditAssetPage() {
  const params = useParams();
  const router = useRouter();
  const assetId = params.id as string;
  const [loading, setLoading] = useState(true);

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      type: "MACHINE",
      status: "GREEN",
      model: "",
      serialNumber: "",
      location: "",
      notes: "",
    },
  });

  useEffect(() => {
    async function loadAsset() {
      try {
        const asset = await getAsset(assetId);
        if (asset) {
          form.reset({
            name: asset.name,
            type: asset.type,
            manufacturer: asset.manufacturer,
            model: asset.model ?? undefined,
            serialNumber: asset.serialNumber ?? undefined,
            location: asset.location ?? undefined,
            status: asset.status,
            purchaseDate: asset.purchaseDate ? asset.purchaseDate.toISOString().split("T")[0] : undefined,
            warrantyUntil: asset.warrantyUntil ? asset.warrantyUntil.toISOString().split("T")[0] : undefined,
            maintenanceIntervalDays: asset.maintenanceIntervalDays ?? undefined,
            notes: asset.notes ?? undefined,
          });
        }
      } catch {
        toast.error("Failed to load asset");
      } finally {
        setLoading(false);
      }
    }
    loadAsset();
  }, [assetId, form]);

  async function onSubmit(values: AssetFormValues) {
    const result = await updateAsset(assetId, values);
    if (result.success) {
      toast.success("Asset updated successfully");
      router.push(`/assets/${assetId}`);
    } else {
      toast.error(result.error || "Something went wrong");
    }
  }

  if (loading) return <div className="p-8 text-center">Loading asset...</div>;

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Edit Asset</h1>
        <Button variant="outline" render={<Link href="/assets" />}>
          Back to List
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asset Details</CardTitle>
          <CardDescription>Update the technical specifications of the asset.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. CNC Mill 01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MACHINE">Machine</SelectItem>
                          <SelectItem value="VEHICLE">Vehicle</SelectItem>
                          <SelectItem value="IT_EQUIPMENT">IT Equipment</SelectItem>
                          <SelectItem value="OFFICE_EQUIPMENT">Office Equipment</SelectItem>
                          <SelectItem value="FACILITY">Facility</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="manufacturer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manufacturer</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Siemens" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. VF-2" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial Number</FormLabel>
                      <FormControl>
                        <Input placeholder="SN-12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Warehouse A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="GREEN">Green (OK)</SelectItem>
                          <SelectItem value="YELLOW">Yellow (Warning)</SelectItem>
                          <SelectItem value="RED">Red (Critical)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purchaseDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="warrantyUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Warranty Until</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maintenanceIntervalDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maintenance Interval (Days)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input placeholder="Additional information..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button variant="outline" render={<Link href={`/assets/${assetId}`} />}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
