import type {
  SupplierAdapter,
  OrderWithItems,
  SubmitOrderResult,
  ExternalOrderStatus,
  ConnectionTestResult,
} from "../types";

function simulateDelay(minMs: number, maxMs: number = minMs): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

const STATUS_SEQUENCE: ExternalOrderStatus["status"][] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

export class DemoAdapter implements SupplierAdapter {
  id = "demo";
  name = "Demo-Adapter";
  description =
    "Simuliert eine Hersteller-API mit realistischen Verzögerungen. Ideal zum Testen der Integration.";

  async isConfigured(): Promise<boolean> {
    return true;
  }

  async submitOrder(order: OrderWithItems): Promise<SubmitOrderResult> {
    await simulateDelay(500, 2000);

    const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const externalOrderId = `DEMO-${suffix}`;

    return {
      success: true,
      externalOrderId,
      message: `Bestellung ${order.orderNumber} erfolgreich übermittelt (Demo-Modus).`,
    };
  }

  async getOrderStatus(
    externalOrderId: string
  ): Promise<ExternalOrderStatus> {
    await simulateDelay(500, 1500);

    // Simulate status progression based on ID hash + time so different orders
    // are at different stages and status advances every ~30 seconds.
    const hash = externalOrderId
      .split("")
      .reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const timeSlot = Math.floor(Date.now() / 30_000);
    const index = (hash + timeSlot) % STATUS_SEQUENCE.length;

    return {
      status: STATUS_SEQUENCE[index],
      lastUpdated: new Date(),
      rawResponse: { demo: true, externalOrderId },
    };
  }

  async testConnection(): Promise<ConnectionTestResult> {
    await simulateDelay(300, 800);
    return {
      success: true,
      message: "Demo-Adapter ist bereit und einsatzbereit.",
      latencyMs: Math.floor(Math.random() * 300) + 100,
    };
  }
}
