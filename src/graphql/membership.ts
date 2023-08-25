import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

import { MyContext } from "../types/MyContextInterface";
import { MovementType } from "../types/MovementsTypes";
import { newMovement } from "../facades/movementsAmounts.js";
import { updateMembership } from "../facades/membership.js";

const typeDefs = `#graphql

type PlanType {
    id: ID!
    name: String
    type: String
    price: Float
    description: String
    }

type Membership {
    id: ID
    userId: Int
    plan: PlanType
    startDate: String
    endDate: String
}
 
 
   
 extend type Query {
        getAllPlans: [PlanType]
    }
  
  type Mutation {
        buyPlan(planId: Int!, planType: String): Boolean
    }
`;

const resolvers = {
  Query: {
    getAllPlans: async (root: any, args: any, context: MyContext) => {
      return await prisma.plan.findMany();
    },
  },
  Mutation: {
    buyPlan: async (root: any, args: any, context: MyContext) => {
      let planType = args.planType || "monthly";

      const plan = await prisma.plan.findFirst({
        where: {
          id: args.planId,
        },
      });

      const finalPrice =
        planType === "monthly" ? plan?.price : plan?.price * 10;
      const months = planType === "monthly" ? 1 : 10;

      const userHaveAmount = await prisma.userAmounts.findFirst({
        where: {
          userId: context.user.id,
          currencyId: 1,
          amount: {
            gte: finalPrice,
          },
        },
      });

      if (plan && userHaveAmount) {
        let payload: MovementType = {
          amount: finalPrice,
          model: "USER",
          modelId: context.user.id,
          details: "Buy Plan",
          currencyId: 1,
          type: "DEBIT",
          status: "COMPLETED",
        };

        await newMovement(prisma, payload);
        await updateMembership(prisma, context.user.id, plan.id, months);

        return true;
      } else {
        throw new Error("Plan not found or user dont have enough amount");
      }
    },
  },
};

export { typeDefs, resolvers };
