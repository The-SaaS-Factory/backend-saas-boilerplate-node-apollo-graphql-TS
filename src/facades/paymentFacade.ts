import {
  Invoice,
  InvoicePayload,
  Plan,
  PrismaClient,
  User,
} from "@prisma/client";
import {
  stripeCreateCustomer,
  stripeCreatePlan,
  stripeCreateProduct,
  stripeCreateSuscription,
} from "./stripeFacade.js";
import { getSuperAdminSetting } from "./adminFacade.js";
import Stripe from "stripe";
import { SettingType } from "../types/User.js";
import { InvoiceType } from "../types/paymentsTypes.js";
import { MovementType } from "../types/MovementsTypes.js";
import { newMovement } from "./movementsAmounts.js";
import { updateMembership } from "./membership.js";

const prisma = new PrismaClient();
export const createPaymentsServicesByDefault = async (serviceName: string) => {
  if (serviceName === "STRIPE_CLIENT_ENABLED") {
    createStripeServiceByDefault("STRIPE_PRODUCT_BY_DEFAULT");
  }
};

const createStripeServiceByDefault = async (serviceName: string) => {
  const existingSetting = await getSuperAdminSetting(serviceName);

  if (!existingSetting) {
    const productId = await stripeCreateProduct({ name: "Membership" });

    if (productId) {
      await prisma.superAdminSetting.create({
        data: {
          settingName: serviceName,
          settingValue: productId,
        },
      });
    }
  }
};

export const connectStripePlanWithLocalPlan = async (localPlanId: number) => {
  const localPlan: any = await prisma.plan.findUnique({
    where: { id: localPlanId },
  });
  let stripeProductId: any = null;
  const stripeProductSaved = await getSuperAdminSetting(
    "STRIPE_PRODUCT_BY_DEFAULT"
  );

  if (localPlan) {
    try {
      if (!stripeProductSaved) {
        stripeProductId = await stripeCreateProduct({ name: "Membership" });
      } else {
        stripeProductId = stripeProductSaved;
      }

      const planPayload: Stripe.PlanCreateParams = {
        amount: localPlan.price,
        currency: "usd",
        interval: localPlan.type,
        product: stripeProductId,
      };
      const stripePlan = await stripeCreatePlan(stripeProductId, planPayload);

      if (stripePlan) {
        const settingPlan = await prisma.planSetting.findFirst({
          where: {
            planId: localPlan.id,
            settingName: "STRIPE_PLAN_ID",
          },
        });

        if (!settingPlan) {
          await prisma.planSetting.create({
            data: {
              planId: localPlan.id,
              settingName: "STRIPE_PLAN_ID",
              settingValue: stripePlan.id,
            },
          });
        } else {
          await prisma.planSetting.update({
            where: {
              id: settingPlan.id,
            },
            data: {
              settingValue: stripePlan.id,
            },
          });
        }

        return true;
      }
    } catch (error) {
      throw new Error(error.message);
    }
  } else {
    throw new Error("Local plan not found");
  }
};

export const createStripeSubscription = async (
  plan: any,
  user: any,
  paymentMethod: any
) => {
  try {
    let customerId = null;
    const setting = user.UserSetting.find(
      (setting: SettingType) => setting.settingName === "STRIPE_CUSTUMER_IR"
    );

    if (setting && setting.settingValue) {
      customerId = setting.settingValue;
    } else {
      const customerPayload: any = {
        email: user.email,
        name: user.name,
        paymentMethod,
      };
      const customer = await stripeCreateCustomer(customerPayload);
      if (customer) {
        customerId = customer.id;
      }

      //Save Customer
      await prisma.userSetting.create({
        data: {
          settingName: "STRIPE_CUSTUMER_IR",
          settingValue: customerId,
          userId: user.id,
        },
      });
    }

    if (customerId && plan) {
      const setting = plan.settings.find(
        (setting) => setting.settingName === "STRIPE_PLAN_ID"
      );
      if (setting) {
        const suscriptionPayload: Stripe.SubscriptionCreateParams = {
          customer: customerId,
          items: [{ price: setting.settingValue }],
          payment_settings: {
            payment_method_options: {
              card: {
                request_three_d_secure: "any",
              },
            },
            payment_method_types: ["card"],
            save_default_payment_method: "on_subscription",
          },
          expand: ["latest_invoice.payment_intent"],
        };

        const subscription: any = await stripeCreateSuscription(
          suscriptionPayload
        );

        const payloadInvoice: InvoiceType = {
          userId: user.id,
          currencyId: 1, // #fix
          gateway: "stripe",
          gatewayId: subscription.latest_invoice.id,
          amount: plan.price,
          model: "plan",
          modelId: plan.id,
          details: "Buy Plan Membership " + plan.name,
          invoiceUrl: subscription.latest_invoice.hosted_invoice_url,
          invoicePdfUrl: subscription.latest_invoice.invoice_pdf,
          status: "PENDING",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        createInvoice(payloadInvoice);

        return {
          clientSecret:
            subscription.latest_invoice.payment_intent.client_secret,
          subscriptionId: subscription.id,
          payment_intent_id: subscription.latest_invoice.payment_intent.id,
          invoice_url: subscription.latest_invoice.hosted_invoice_url,
          invoice_id: subscription.latest_invoice.id,
          invoice_pdf_url: subscription.latest_invoice.invoice_pdf,
        };
      }
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

export const createInvoice = async (invoicePayload: InvoiceType) => {
  const invoice = await prisma.invoice
    .create({
      data: invoicePayload,
    })
    .catch((e) => console.log(e));
};
export const updateInvoice = async (invoiceId: number, invoiceStatus: string) => {
  await prisma.invoice
    .update({
      where: {
        id: invoiceId,
      },
      data: {
        status: invoiceStatus,
        paidAt: invoiceStatus === 'PAID' && new Date(),
      },
    })
    .catch((e) => console.log(e));
};

export const stripeEventBuyCredit = async (eventData) => {
  let payload: MovementType = {
    amount: eventData.metadata?.creditAmount
      ? parseInt(eventData.metadata?.creditAmount)
      : 1,
    model: "USER",
    modelId: eventData.metadata?.userId
      ? parseInt(eventData.metadata?.userId)
      : 0,
    details: "Add credit",
    currencyId: 1,
    type: "CREDIT",
    status: "COMPLETED",
  };

  await newMovement(prisma, payload);
};

export const stripeEventInvoicePaid = async (eventData) => {
  let invoice = await prisma.invoice.findFirst({
    where: {
      gatewayId: eventData.id,
    },
    include: {
      user: true,
    },
  });

  if (invoice) {
    updateInvoice(invoice.id, "PAID");
    if (invoice.model === "plan") {
      const plan = await prisma.plan.findUnique({
        where: {
          id: invoice.modelId,
        },
      });

      if (plan) {
        let months = 1;

        switch (plan.type) {
          case "month":
            months = 1;
            break;
          case "quarterly":
            months = 3;
            break;
          case "semiannually":
            months = 6;
            break;
          case "year":
            months = 12;
            break;
          case "biennially":
            months = 24;
            break;
          case "triennially":
            months = 36;
            break;
          case "lifetime":
            months = 1200;
            break;

          default:
            1;
            break;
        }

        await updateMembership(prisma, invoice.userId, invoice.modelId, months);
      }
    }
  }
};
