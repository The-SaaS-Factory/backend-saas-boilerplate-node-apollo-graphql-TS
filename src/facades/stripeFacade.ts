import Stripe from "stripe";
import {
  getAdminSettingValue,
  getCurrencyIdByCode,
  getSuperAdminSetting,
} from "./adminFacade.js";
import {
  createInvoice,
  invoicePaid,
  saveStripeCustomerId,
  stripeEventPaymentFailed,
} from "./paymentFacade.js";
import { notifyAdmin, sendInternalNotificatoin } from "./notificationFacade.js";
import { InvoiceType } from "../types/paymentsTypes.js";
import { getPlanByStripePlanId } from "./membershipFacade.js";
import { Plan, PrismaClient } from "@prisma/client";
import { SettingType } from "../types/User.js";

type ClientSessionPayloadType = {
  customerId?: string;
  modelId: string;
  email?: string;
};

const prisma = new PrismaClient();

const makeStripeClient = async () => {
  const stripeMode = await getSuperAdminSetting("STRIPE_MODE");
  const STRIPE_CLIENT_SECRET_PRODUCTION = await getSuperAdminSetting(
    "STRIPE_CLIENT_SECRET_PRODUCTION"
  );
  const STRIPE_CLIENT_SECRET_SANDBOX = await getSuperAdminSetting(
    "STRIPE_CLIENT_SECRET_SANDBOX"
  );

  const stripeSectret =
    stripeMode === "prod"
      ? STRIPE_CLIENT_SECRET_PRODUCTION
      : STRIPE_CLIENT_SECRET_SANDBOX;

  return new Stripe(stripeSectret, { apiVersion: "2022-11-15" });
};

export const stripeWebhook = async (requestBody, response) => {
  const stripe = await makeStripeClient();
  const payload = requestBody;

  const endpointSecret = await getSuperAdminSetting("STRIPE_ENDPOINT_SECRET");

  const payloadString = JSON.stringify(payload, null, 2);
  const secret = endpointSecret;

  const header = stripe.webhooks.generateTestHeaderString({
    payload: payloadString,
    secret,
  });

  const event = stripe.webhooks.constructEvent(payloadString, header, secret);
  const eventData = event.data.object as Stripe.PaymentIntent;

  console.log("eventData", event.type);

  try {
    switch (event.type) {
      case "invoice.paid":
        await stripeEventInvoicePaid(eventData);
        break;
      case "payment_intent.payment_failed":
        await stripeEventPaymentFailed(eventData);
        break;
      case "checkout.session.completed":
        await stripeEventCheckoutCompleted(eventData);
        break;

      default:
        break;
    }

    return response.status(200).send(`OK`);
  } catch (err) {
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }
};

export const stripeGetClientByCustomerId = async (customerId: string) => {
  const client = await prisma.stripeCustomer.findFirst({
    where: {
      customerId: customerId,
    },
  });

  return client;
};

export const stripeEventInvoicePaid = async (eventData: any) => {
  try {
    let plan = null;
    const subscription: any = await stripeRetriveSubscription(
      eventData.subscription
    );

    if (subscription) {
      plan = await getPlanByStripePlanId(subscription.plan.id);
    }

    const client = await stripeGetClientByCustomerId(eventData.customer); //Can be user or organization

    console.log("invoice paid event,Part 1Client", client);

    const userId = client
      ? client.model === "User"
        ? client.modelId
        : null
      : null;
    const organizationId = client
      ? client.model === "Organization"
        ? client.modelId
        : null
      : null;

    console.log("invoice paid event,Part 2", organizationId);

    const payloadInvoice: InvoiceType = {
      subscriptionExternalId: subscription ? subscription.id : null,
      userCustomerExternalId: eventData.customer ?? null,
      userId: client && client.model === "User" ? userId : null,
      organizationId:
        client && client.model === "Organization" ? organizationId : null,
      currencyId: (await getCurrencyIdByCode(eventData.currency)) ?? 1,
      gateway: "stripe",
      gatewayId: eventData.id,
      amount: eventData.amount_paid / 100,
      model: plan ? "plan" : null,
      modelId: plan ? plan.id : null,
      details: "Subscription paid for " + plan.name,
      invoiceUrl: eventData.hosted_invoice_url,
      invoicePdfUrl: eventData.invoice_pdf,
      status: "COMPLETED",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const invoice = await createInvoice(payloadInvoice);

    //Only active events for invoice paid with userId

    if (invoice && (invoice.userId || invoice.organizationId)) {
      invoicePaid(invoice.id);
    }

    return "ok";
  } catch (error) {
    console.log(error);
  }
};
export const stripeRetriveSubscription = async (subscriptionId: string) => {
  const stripe = await makeStripeClient();
  return await stripe.subscriptions.retrieve(subscriptionId);
};
export const stripeRetriveInvoice = async (invoiceId: string) => {
  const stripe = await makeStripeClient();
  return await stripe.invoices.retrieve(invoiceId);
};

export const stripeEventCheckoutCompleted = async (eventData) => {
  try {
    //Sync customer stripe with user or organization by client_reference_id
    let client = null;
    let model = null;
    const clientReference: string = eventData.client_reference_id;

    const scope = clientReference.split("-")[0];
    const id = clientReference.split("-")[1];

    if (scope === "U") {
      client = await prisma.stripeCustomer.findFirst({
        where: {
          model: "User",
          modelId: parseInt(id),
          customerId: eventData.customer,
        },
      });
      model = "User";
    } else if (scope === "O") {
      client = await prisma.stripeCustomer.findFirst({
        where: {
          model: "Organization",
          modelId: parseInt(id),
          customerId: eventData.customer,
        },
      });
      model = "Organization";
    }

    if (!client) {
      await saveStripeCustomerId(model, parseInt(id), eventData.customer);
    }

    await checkInvoicesWithOutUserId(eventData.invoice, model, parseInt(id));

  

    return "ok";
  } catch (error) {
    console.log(error);
  }
};

const checkInvoicesWithOutUserId = async (
  invoiceId: string,
  model: string,
  modelId: number
) => {
  const invoice = await prisma.invoice.findFirst({
    where: {
      gatewayId: invoiceId,
    },
  });

  if (invoice && !invoice.userId && model === "User") {
    await prisma.invoice.update({
      where: {
        id: invoice.id,
      },
      data: {
        userId: modelId,
      },
    });

    invoicePaid(invoice.id);
  } else if (invoice && !invoice.organizationId && model === "Organization") {
    await prisma.invoice.update({
      where: {
        id: invoice.id,
      },
      data: {
        organizationId: modelId,
      },
    });

    invoicePaid(invoice.id);
  }
};

export const stripeCreateProduct = async (productPayload: any) => {
  const stripe = await makeStripeClient();

  if (stripe) {
    const product = await stripe.products.create({
      name: productPayload.name,
    });

    return product.id;
  }

  return null;
};

export const stripeCreatePlan = async (
  productId: string,
  planPayload: Stripe.PlanCreateParams
) => {
  const stripe = await makeStripeClient();

  return await stripe.plans.create({
    amount: planPayload.amount * 100,
    currency: planPayload.currency,
    interval: planPayload.interval,
    product: productId,
  });
};

export const stripeCreateCustomer = async (customerPayload: any) => {
  try {
    const stripe = await makeStripeClient();
    const paymentMethod = await stripCreatePaymentMethod();

    if (!paymentMethod) throw new Error("Error creating payment method");

    return await stripe.customers.create({
      name: customerPayload.name ?? null,
      email: customerPayload.email ?? null,
      payment_method: customerPayload.paymentMethod.id,
      invoice_settings: {
        default_payment_method: customerPayload.paymentMethod.id,
      },
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

export const stripCreatePaymentMethod = async () => {
  try {
    const stripe = await makeStripeClient();
    return await stripe.paymentMethods.create({
      type: "card",
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

export const stripeCreateCheckoutSession = async (
  payload: any,
  clientPayload: ClientSessionPayloadType,
  res: any
) => {
  try {
    const domain = await getSuperAdminSetting("PLATFORM_FRONTEND_URL");
    const stripe = await makeStripeClient();

    let sessionPayload: any = {
      line_items: [
        {
          price: payload.priceId,
          quantity: 1,
        },
      ],
      client_reference_id: clientPayload.modelId,
      mode: "subscription",
      metadata: {
        modelId: clientPayload.modelId,
      },
      success_url: `${domain}/home/settings?paymentStatus=success`,
      cancel_url: `${domain}/home/settings?paymentStatus=error`,
    };

    if (clientPayload.customerId) {
      sessionPayload.customer = clientPayload.customerId;
    } else {
      sessionPayload.payment_method_types = ["card"];
      sessionPayload.customer_email = payload.email;
    }

    const session = await stripe.checkout.sessions.create(sessionPayload);

    res.json({ url: session.url });
  } catch (error) {
    throw new Error(error.message);
  }
};

export const stripeCreateSuscription = async (
  subscriptionPayload: Stripe.SubscriptionCreateParams
) => {
  const stripe = await makeStripeClient();

  return await stripe.subscriptions.create(subscriptionPayload);
};
