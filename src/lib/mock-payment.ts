export type MockPaymentStatus = "approved" | "rejected" | "pending";

const PREFIX = "mock_payment_status:";

export function isMockPaymentStatus(value: string | null | undefined): value is MockPaymentStatus {
  return value === "approved" || value === "rejected" || value === "pending";
}

export function encodeMockPaymentMarker(status: MockPaymentStatus): string {
  return `${PREFIX}${status}:${Date.now()}`;
}

export function parseMockPaymentStatusFromPaymentId(
  paymentId: string | null | undefined
): MockPaymentStatus | null {
  if (!paymentId || !paymentId.startsWith(PREFIX)) return null;
  const parts = paymentId.split(":");
  const status = parts[1];
  return isMockPaymentStatus(status) ? status : null;
}

