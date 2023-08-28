import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import { getSuperAdminSetting } from "./adminFacade.js";

const prisma = new PrismaClient();
//Stripe

const makeStripeClient = async () => {
  const stripeMode = await getSuperAdminSetting("STRIPE_MODE");
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

export const stripeCreateSuscriptionApi = async (
  createSubscriptionRequest: any
) => {
//   const stripe = await makeStripeClient();

//   const priceId = createSubscriptionRequest.priceId;
//   const payload: Stripe.SubscriptionCreateParams = {
//     customer: customer.id,
//     items: [{ price: priceId }],
//     payment_settings: {
//       payment_method_options: {
//         card: {
//           request_three_d_secure: "any",
//         },
//       },
//       payment_method_types: ["card"],
//       save_default_payment_method: "on_subscription",
//     },
//     expand: ["latest_invoice.payment_intent"],
//   };

//   console.log(payload);

//   const subscription: any = await stripe.subscriptions.create(payload);

//   // return the client secret and subscription id
//   return {
//     clientSecret: subscription.latest_invoice.payment_intent.client_secret,
//     subscriptionId: subscription.id,
//   };
};
