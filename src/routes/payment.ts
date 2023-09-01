import express from "express";
import bodyParser from "body-parser";

import { stripeWebhook } from "../facades/stripeFacade.js";

const payments = express.Router();

payments.post(
  "/stripe/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (request, response) => {
    return await stripeWebhook(request.body, response);
  }
);
export default payments;
