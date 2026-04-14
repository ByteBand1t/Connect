"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createSupplierConfig } from "@/lib/actions/integrations";

const schema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  adapterId: z.enum(["demo", "rest"] as const),
  isActive: z.boolean(),
  // REST-specific
  baseUrl: z.string().optional(),
  apiKey: z.string().optional(),
  headerName: z.string().optional(),
  submitEndpoint: z.string().optional(),
  statusEndpoint: z.string().optional(),
  httpMethod: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewIntegrationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      adapterId: "demo",
      isActive: true,
      baseUrl: "",
      apiKey: "",
      headerName: "X-API-Key",
      submitEndpoint: "/orders",
      statusEndpoint: "/orders",
      httpMethod: "POST",
    },
  });

  const adapterId = form.watch("adapterId");

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const config: Record<string, string> = {};
      if (values.adapterId === "rest") {
        if (values.baseUrl) config.baseUrl = values.baseUrl;
        if (values.apiKey) config.apiKey = values.apiKey;
        if (values.headerName) config.headerName = values.headerName;
        if (values.submitEndpoint)
          config.submitEndpoint = values.submitEndpoint;
        if (values.statusEndpoint)
          config.statusEndpoint = values.statusEndpoint;
        if (values.httpMethod) config.httpMethod = values.httpMethod;
      }

      const result = await createSupplierConfig({
        name: values.name,
        adapterId: values.adapterId,
        isActive: values.isActive,
        config,
      });

      if (result.success) {
        toast.success("Integration erfolgreich erstellt.");
        router.push("/settings/integrations");
      } else {
        toast.error(result.error ?? "Fehler beim Erstellen.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Neue Integration</h1>
        <Button
          variant="outline"
          render={<Link href="/settings/integrations" />}
        >
          Zurück
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Integration konfigurieren</CardTitle>
          <CardDescription>
            Wähle einen Adapter und konfiguriere die Verbindungsparameter.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="z.B. Siemens-ERP"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="adapterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adapter</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        {...field}
                      >
                        <option value="demo">Demo-Adapter (Testen)</option>
                        <option value="rest">REST-API-Adapter</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3">
                    <FormControl>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">
                      Integration aktivieren
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {adapterId === "rest" && (
                <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
                  <p className="text-sm font-medium text-muted-foreground">
                    REST-API Konfiguration
                  </p>

                  <FormField
                    control={form.control}
                    name="baseUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Basis-URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://api.example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="apiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API-Key</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="sk-..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="headerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Header-Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="X-API-Key"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="submitEndpoint"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Submit-Endpunkt</FormLabel>
                          <FormControl>
                            <Input placeholder="/orders" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="statusEndpoint"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status-Endpunkt</FormLabel>
                          <FormControl>
                            <Input placeholder="/orders" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="httpMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>HTTP-Methode</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            {...field}
                          >
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="PATCH">PATCH</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  render={<Link href="/settings/integrations" />}
                >
                  Abbrechen
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Speichern…" : "Integration erstellen"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
