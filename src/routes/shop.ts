import express from "express";
import { env } from "process";
import bodyParser from "body-parser";
import { MovementType } from "../types/MovementsTypes";
import { newMovement } from "../facades/movementsAmounts.js";
import { PrismaClient } from "@prisma/client";
const shop = express.Router();
const prisma = new PrismaClient();

const products = [
  {
    id: 1,
    name: "+5 lifes",
    href: "#",
    price: 1,
    lifes: 5,
    imageSrc: "/assets/img/heart.png",
    imageAlt: "More lifes",
  },
  {
    id: 2,
    name: "+10 lifes",
    href: "#",
    price: 2,
    lifes: 10,
    imageSrc: "/assets/img/heart.png",
    imageAlt: "More lifes",
  },
  {
    id: 3,
    name: "+15 lifes",
    href: "#",
    price: 3,
    lifes: 15,
    imageSrc: "/assets/img/heart.png",
    imageAlt: "More lifes",
  },
  {
    id: 4,
    name: "+20 lifes",
    href: "#",
    price: 4,
    lifes: 20,
    imageSrc: "/assets/img/heart.png",
    imageAlt: "More lifes",
  },
];

shop.post("/buy-product", async (req, res) => {
  try {
    const productId = req.body.productPriceId;
    const userId = req.body.userId;
    const customer_email = req.body.customer_email;
    const price = products.find(
      (product) => product.id === parseInt(productId)
    ).price;
    console.log(productId);

    const userAmount = await prisma.userAmounts.findFirst({
      where: {
        userId: parseInt(userId),
        currencyId: 1,
      },
    });

    if (userAmount.amount >= price) {
      let payload: MovementType = {
        amount: price,
        model: "USER",
        modelId: parseInt(userId),
        details: "Buy Product",
        currencyId: 1,
        type: "DEBIT",
        status: "COMPLETED",
      };

      await newMovement(prisma, payload);

      let lifesPayload: MovementType = {
        amount: products.find((product) => product.id === parseInt(productId))
          .lifes,
        model: "USER",
        modelId: parseInt(userId),
        details: "Buy Lifes",
        currencyId: 3,
        type: "CREDIT",
        status: "COMPLETED",
      };

      await newMovement(prisma, lifesPayload);

      res.redirect(303, env.APP_DOMAIN_FRONT + "/account?lifes=true");
    }else{
        res.redirect(303, env.APP_DOMAIN_FRONT + "/account?lifesNotAmountError=true");
    }
  } catch (error) {
    console.log(error);
  }
});

export default shop;
