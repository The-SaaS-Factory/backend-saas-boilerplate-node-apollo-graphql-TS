import { MovementType } from "../types/MovementsTypes";
import { MovementAmountType } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { assignLevelToUser, sendNotification } from "./auth.js";
import { PubSub } from "graphql-subscriptions";
import { traslateForUser } from "./str.js";

const prisma = new PrismaClient();
import pubsub from "../facades/pubSubFacade.js";

export const newMovement = async (
  client: PrismaClient,
  payload: MovementType
) => {
  //create an movement
  const movement = await client.adminMovementsAmounts.create({
    data: {
      amount: payload.amount,
      type: payload.type,
      model: "USER",
      modelId: payload.modelId,
      details: payload.details,
      status: payload.status,
      currencyId: payload.currencyId,
    },
  });

  if (movement) {
    const amount = await operateAmount(
      client,
      "USER",
      movement.modelId,
      movement.currencyId,
      payload.type,
      movement.amount
    );
  }

  //If the currency is 2 // POINTS EXP
  if (movement.currencyId === 2 && movement.model === "USER") {
    //If need up the level of the user
    await assignLevelToUser(client, movement.modelId);
  }

  return movement;
};

export const operateAmount = async (
  client: PrismaClient,
  model: string,
  modelId: number,
  currencyId: number,
  operation: MovementAmountType,
  amount: number
) => {
  switch (model) {
    case "USER":
      const userAmount = await client.userAmounts.findFirst({
        where: {
          userId: modelId,
          currencyId: currencyId,
        },
      });

      if (operation === "CREDIT") {
        if (!userAmount) {
          return await client.userAmounts.create({
            data: {
              amount: amount ?? 0,
              userId: modelId,
              currencyId: currencyId ?? 1,
            },
          });
        } else {
          let currencyName = currencyId == 1 ? "credits" : "exp";

          const message = await traslateForUser("movementAmount", modelId, {
            amount: amount + " " + currencyName,
          });

          sendNotification(
            "INTERNAL",
            userAmount.userId,
            "ACCOUNT",
            message,
            pubsub,
            ""
          );

          return await client.userAmounts.update({
            where: {
              id: userAmount.id,
            },
            data: {
              amount: {
                increment: amount,
              },
            },
          });
        }
      } else {
        const result = await client.userAmounts.update({
          where: {
            id: userAmount.id,
          },
          data: {
            amount: {
              decrement: amount,
            },
            currencyId: currencyId,
          },
        });

        if (result) {
          if (result.amount < 0) {
            return await client.userAmounts.update({
              where: {
                id: userAmount.id,
              },
              data: {
                amount: 0,
                currencyId: currencyId,
              },
            });
          }
        }
      }
      break;

    default:
      break;
  }
};
