import Stripe from "stripe";
import { getSuperAdminSetting } from "./adminFacade.js";
import { stripeEventInvoicePaid } from "./paymentFacade.js";

const makeStripeClient = async () => {
  const stripeMode = await getSuperAdminSetting("STRIPE_MODE");
  console.log(stripeMode);

  const STRIPE_CLIENT_SECRET_PRODUCTION = await getSuperAdminSetting(
    "STRIPE_CLIENT_SECRET_PRODUCTION"
  );
  const STRIPE_CLIENT_SECRET_SANDBOX = await getSuperAdminSetting(
    "STRIPE_CLIENT_SECRET_SANDBOX"
  );

  const stripeSectret =
    stripeMode === "PRODUCTION"
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

      default:
        break;
    }

    return response.status(200).send(`OK`);
  } catch (err) {
    return response.status(400).send(`Webhook Error: ${err.message}`);
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

export const stripeCreateSuscription = async (
  subscriptionPayload: Stripe.SubscriptionCreateParams
) => {
  const stripe = await makeStripeClient();

  return await stripe.subscriptions.create(subscriptionPayload);
};
