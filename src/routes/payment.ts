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
  let client = null;
  let modelId = null;
  const clientRereferenceId = request.body.client_reference_id;
  if (!clientRereferenceId) throw new Error("Client Id not found");

  const scope = clientRereferenceId.split("-")[0];
  const id = clientRereferenceId.split("-")[1];

  if (scope === "U") {
    const user = await prisma.user.findFirst({
      where: {
        externalId: id,
      },
    });

    if (!user) throw new Error("User not found");

    client = await prisma.stripeCustomer.findFirst({
      where: {
        model: "User",
        modelId: user.id,
      },
    });

    modelId = `U-${user.id}`;

  } else if (scope === "O") {
    const organization = await prisma.organization.findFirst({
      where: {
        externalId: id,
      },
    });

    if (!organization) throw new Error("Organization not found");

    client = await prisma.stripeCustomer.findFirst({
      where: {
        model: "Organization",
        modelId: organization.id,
      },
    });

    modelId = `O-${organization.id}`;
  }

  const clientPayload = {
    customerId: client ? client.customerId : null,
    modelId,
    email: null, //Fix this
  };

  return await stripeCreateCheckoutSession(
    request.body,
    clientPayload,
    response
  );
});
export default payments;
