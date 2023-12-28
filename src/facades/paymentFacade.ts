import { PrismaClient } from "@prisma/client";
import {
  stripeCreatePlan,
  stripeCreateProduct,
  stripeCreateSuscription,
} from "./stripeFacade.js";
import { getAdminSettingValue, getSuperAdminSetting } from "./adminFacade.js";
import Stripe from "stripe";
import { SettingType } from "../types/User.js";
import { InvoiceType } from "../types/paymentsTypes.js";
import { updateMembership } from "./membershipFacade.js";
import { notifyAdmin, sendInternalNotificatoin } from "./notificationFacade.js";

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

      let intervalCount = 1;
      let intervaltype: Stripe.PlanCreateParams.Interval = "month";

      switch (localPlan.type) {
        case "month":
          intervalCount = 1;
          break;
        case "quarterly":
          intervalCount = 3;
          intervaltype = "month";
          break;
        case "semiannually":
          intervalCount = 6;
          intervaltype = "month";
          break;
        case "year":
          intervalCount = 12;
          intervaltype = "year";
          break;
        case "biennially":
          intervalCount = 24;
          intervaltype = "year";
          break;
        case "triennially":
          intervalCount = 36;
          intervaltype = "year";
          break;
        case "lifetime":
          intervalCount = 1200;
          intervaltype = "year";
          break;

        default:
          1;
          break;
      }

      const planPayload: Stripe.PlanCreateParams = {
        amount: localPlan.price,
        currency: "usd",
        interval: intervaltype,
        interval_count: intervalCount,
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

export const saveStripeCustomerId = async (
  model: string,
  modelId: number,
  customerId: string
) => {
  return await prisma.stripeCustomer.create({
    data: {
      model: model,
      modelId: modelId,
      customerId: customerId,
    },
  });
};

export const createInvoice = async (invoicePayload: InvoiceType) => {
  return await prisma.invoice.create({
    data: invoicePayload,
  });
};
export const updateInvoice = async (invoiceId: number, payload) => {
  await prisma.invoice
    .update({
      where: {
        id: invoiceId,
      },
      data: payload,
    })
    .catch((e) => console.log(e));
};

export const stripeEventPaymentFailed = async (eventData) => {
  const setting: any = getAdminSettingValue(
    "STRIPE_CUSTUMER_IR",
    eventData.customer
  );

  if (setting && setting.userId) {
    sendInternalNotificatoin(
      setting.userId,
      "Payment failed",
      eventData.last_payment_error.message
    );

    notifyAdmin(
      "payment_failed",
      `Payment failed for user ${setting.userId}, message: ${eventData.last_payment_error.message}`
    );
  }
};

export const invoicePaid = async (invoiceId) => {
  let invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
    },
    include: {
      user: true,
    },
  });

  if (invoice) {
    if (invoice.model === "plan") {
      const plan = await prisma.plan.findUnique({
        where: {
          id: invoice.modelId,
        },
      });

      if (plan) {
        let months = 1;

        switch (
          plan.type //Fix this, put the type in the plan in a global constant for create plan with some type
        ) {
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

        const membership = await updateMembership({
          model: invoice.userId ? "User" : "Organization",
          modelId: invoice.userId ? invoice.userId : invoice.organizationId,
          months,
          freeTrial: false,
          planId: plan.id,
        });

        const payload = {
          status: "PAID",
          paidAt: new Date(),
          model: "membership",
          modelId: membership.id,
        };
        updateInvoice(invoice.id, payload);
        invoice.userId &&
        sendInternalNotificatoin(invoice.userId, "Payment success", "");
        notifyAdmin(
          "payment_success",
          `Payment success for user ${invoice.userId}`
        );
      }
    }
  }
};
