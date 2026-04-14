export interface OrderWithItems {
  id: string;
  orderNumber: string;
  status: string;
  assetId: string;
  asset?: { id: string; name: string } | null;
  items: {
    id: string;
    partNumber: string;
    name: string;
    quantity: number;
    unitPrice?: number | null;
    totalPrice?: number | null;
  }[];
  totalAmount?: number | null;
  currency: string;
  notes?: string | null;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierAdapter {
  /** Eindeutiger Adapter-Bezeichner */
  id: string;
  /** Anzeigename */
  name: string;
  /** Beschreibung */
  description: string;
  /** Ob der Adapter konfiguriert und einsatzbereit ist */
  isConfigured(): Promise<boolean>;
  /** Bestellung an den Hersteller übermitteln */
  submitOrder(order: OrderWithItems): Promise<SubmitOrderResult>;
  /** Bestellstatus beim Hersteller abfragen */
  getOrderStatus(externalOrderId: string): Promise<ExternalOrderStatus>;
  /** Verbindung/Konfiguration testen */
  testConnection(): Promise<ConnectionTestResult>;
}

export interface SubmitOrderResult {
  success: boolean;
  externalOrderId?: string;
  message?: string;
  errors?: string[];
}

export interface ExternalOrderStatus {
  status: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "ERROR" | "UNKNOWN";
  lastUpdated?: Date;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  rawResponse?: Record<string, unknown>;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
}
