import express from "express";
import Stripe from "stripe";
import { env } from "process";
import bodyParser from "body-parser";
import { MovementType } from "../types/MovementsTypes";
import { newMovement } from "../facades/movementsAmounts.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const payments = express.Router();

const stripeSectret =
  env.STRIPE_MODE === "live"
    ? env.STRIPE_SECRET_KEY_LIVE
    : env.STRIPE_SECRET_KEY;

//Stripe
const stripe = new Stripe(stripeSectret, { apiVersion: "2022-11-15" });

const endpointSecret = env.STRIPE_WEBHOOK;

const products = [
  {
    name: "Credit 7",
    credits: 7,
    productPriceId: "price_1NYTHEEovvok1wNL0gW5VSh8",
    price: "$1,00",
    currency: "USD",
  },
  {
    name: "Credit 7",
    credits: 7,
    productPriceId: "price_1NYTHEEovvok1wNLW9Vv9B0H",
    price: "R $5,00",
    currency: "BRL",
  },
  {
    name: "Credit 35",
    credits: 35,
    productPriceId: "price_1NYTHEEovvok1wNLCD1czVT3",
    price: "$5,00",
    currency: "USD",
  },
  {
    name: "Credit 35",
    credits: 35,
    productPriceId: "price_1NYTHEEovvok1wNLgOo90afm",
    price: "R $25,00",
    currency: "BRL",
  },
  {
    name: "Credit 70",
    credits: 70,
    productPriceId: "price_1NYTHEEovvok1wNLPyGlHnZ1",
    price: "$10,00",
    currency: "USD",
  },
  {
    name: "Credit 70",
    credits: 70,
    productPriceId: "price_1NYTHEEovvok1wNLUQToobag",
    price: "R $50,00",
    currency: "BRL",
  },
  {
    name: "Credit 175",
    credits: 175,
    productPriceId: "price_1NYTHEEovvok1wNL5L1wRJq1",
    price: "$25,00",
    currency: "USD",
  },
  {
    name: "Credit 175",
    credits: 175,
    productPriceId: "price_1NYTHEEovvok1wNL6GhqMnMX",
    price: "R $125,00",
    currency: "BRL",
  },
  {
    name: "Credit 350",
    credits: 350,
    productPriceId: "price_1NYTHEEovvok1wNLmv7Z8iY4",
    price: "$50,00",
    currency: "USD",
  },
  {
    name: "Credit 350",
    credits: 350,
    productPriceId: "price_1NYTHEEovvok1wNLH7v0RovF",
    price: "R $250,00",
    currency: "BRL",
  },
  {
    name: "Credit 700",
    credits: 700,
    productPriceId: "price_1NYTHEEovvok1wNLwDlusNoe",
    price: "$100,00",
    currency: "USD",
  },
  {
    name: "Credit 700",
    credits: 700,
    productPriceId: "price_1NYTHEEovvok1wNL3mCVr8Do",
    price: "R $500,00",
    currency: "BRL",
  },
  {
    name: "Credit 3500",
    credits: 3500,
    productPriceId: "price_1NYTHEEovvok1wNLFRcLGB0A",
    price: "$500,00",
    currency: "USD",
  },
  {
    name: "Credit 3500",
    credits: 3500,
    productPriceId: "price_1NYTHEEovvok1wNLvlG7vMzW",
    price: "R $2500,00",
    currency: "BRL",
  },
  {
    name: "Credit 7000",
    credits: 7000,
    productPriceId: "price_1NYTHEEovvok1wNLpzOorPU9",
    price: "$1000,00",
    currency: "USD",
  },
];

payments.post("/create-checkout-stripe", async (req, res) => {
  try {
    const productPriceId = req.body.productPriceId;
    const userId = req.body.userId;
    const customer_email = req.body.customer_email;

    const metadata = {
      userId: userId,
      creditAmount:
        products.find((product) => product.productPriceId === productPriceId)
          .credits ?? "1",
    };

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: productPriceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: metadata,
      client_reference_id: userId,
      customer_email: customer_email,
      success_url: `https://creo.red/payment?success=true`,
      cancel_url: `https://creo.red/payment?canceled=true`,
    });

    res.redirect(303, session.url);
  } catch (error) {
    console.log(error);
  }
});

payments.post(
  "/stripe/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (request, response) => {
    const payload = request.body;
    const payloadString = JSON.stringify(payload, null, 2);
    const secret = endpointSecret;

    const header = stripe.webhooks.generateTestHeaderString({
      payload: payloadString,
      secret,
    });

    const event = stripe.webhooks.constructEvent(payloadString, header, secret);
    const eventData = event.data.object as Stripe.PaymentIntent;

    try {
      if (event.type === "checkout.session.completed" && eventData) {
        //CREDIT
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
      }

      return response.status(200).send(`OK`);
    } catch (err) {
      return response.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);
export default payments;
