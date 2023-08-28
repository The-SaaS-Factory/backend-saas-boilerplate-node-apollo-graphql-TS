export type InvoiceType = {
    id?: number;
    userId: number;
    model: string;
    modelId: number;
    details: string;
    currencyId: number;
    gateway: string;
    gatewayId?: string | null;
    amount: number;
    invoiceUrl?: string | null;
    invoicePdfUrl?: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };