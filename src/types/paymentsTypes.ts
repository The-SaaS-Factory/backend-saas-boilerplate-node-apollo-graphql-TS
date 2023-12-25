export type InvoiceType = {
  id?: number;
  userId: number;
  organizationId: number;
  userCustomerExternalId?: string | null;
  model: string;
  modelId: number;
  details: string;
  subscriptionExternalId?: string | null;
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
