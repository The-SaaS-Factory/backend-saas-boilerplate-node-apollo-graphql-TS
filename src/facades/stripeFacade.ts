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
import { Plan } from "@prisma/client";

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

export const stripeEventInvoicePaid = async (eventData) => {
  return invoicePaid(eventData.id);
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
    const userId: number = parseInt(eventData.client_reference_id);
    const subscription: any = await stripeRetriveSubscription(
      eventData.subscription
    );
    const invoiceStripe: any = await stripeRetriveInvoice(
      subscription.latest_invoice
    );
    const plan: Plan = await getPlanByStripePlanId(subscription.plan.id);

    console.log("invoiceStripe", plan);
    console.log("userId", userId);

    if (userId && plan && invoiceStripe && subscription) {
      saveStripeCustomerId(userId, eventData.customer);

      const payloadInvoice: InvoiceType = {
        userId: userId,
        currencyId: (await getCurrencyIdByCode(eventData.currency)) ?? 1,
        gateway: "stripe",
        gatewayId: invoiceStripe.id,
        amount: plan.price,
        model: "plan",
        modelId: plan.id,
        details: "Buy Plan Membership " + plan.name,
        invoiceUrl: invoiceStripe.hosted_invoice_url,
        invoicePdfUrl: invoiceStripe.invoice_pdf,
        status: "PENDING",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const invoice = await createInvoice(payloadInvoice);

      invoicePaid(invoice.gatewayId);
    } else {
      //Fix this, store this events in a table for later check
    }
  } catch (error) {
    console.log(error);
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
    return await stripe.customers.create({
      name: customerPayload.name,
      email: customerPayload.email,
      payment_method: customerPayload.paymentMethod,
      invoice_settings: {
        default_payment_method: customerPayload.paymentMethod,
      },
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

export const stripeCreateCheckoutSession = async (
  payload: any,
  clientPayload: any,
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
      client_reference_id: clientPayload.userId,
      currency: !clientPayload.customerId ? payload.currency : "usd", //old client can't change currency #Fix This
      mode: "subscription",
      success_url: `${domain}/home/billing/subscriptions/paymentCompleted`,
      cancel_url: `${domain}home/billing/subscriptions/paymentFailed`,
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
