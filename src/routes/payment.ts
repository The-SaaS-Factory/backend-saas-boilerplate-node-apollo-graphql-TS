import express from "express";
import bodyParser from "body-parser";

import {
  stripeCreateCheckoutSession,
  stripeWebhook,
} from "../facades/stripeFacade.js";
import { getUser } from "../facades/userFacade.js";
import { PrismaClient } from "@prisma/client";
import { SettingType } from "../types/User.js";
const prisma = new PrismaClient();
const payments = express.Router();

payments.post(
  "/stripe/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (request, response) => {
    return await stripeWebhook(request.body, response);
  }
);

payments.post("/stripe/create-checkout-session", async (request, response) => {
  let customerId = null;
 
  const user = await prisma.user.findUnique({
    where: { id: request.body.client_reference_id },
    include: { UserSetting: true },
  });

  const setting = user.UserSetting.find(
    (setting: SettingType) => setting.settingName === "STRIPE_CUSTUMER_IR"
  );

  if (setting && setting.settingValue) {
    customerId = setting.settingValue;
  }

  const clientPayload = {
    customerId,
    userId: user.id,
  };

  return await stripeCreateCheckoutSession(request.body, clientPayload, response);
});
export default payments;
