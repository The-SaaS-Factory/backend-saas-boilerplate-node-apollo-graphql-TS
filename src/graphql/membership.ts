import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

import { MyContext } from "../types/MyContextInterface";
import { MovementType } from "../types/MovementsTypes";
import { newMovement } from "../facades/movementsAmounts.js";
import { updateMembership } from "../facades/membership.js";
import {
  connectStripePlanWithLocalPlan,
  createStripeSubscription,
} from "../facades/paymentFacade.js";

const typeDefs = `#graphql

type PlanType {
    id: ID!
    name: String
    type: String
    price: Float
    description: String
    settings: [PlanSettingType]
    }
 type PlanSettingType {
    settingName: String
    settingValue: String
  }
type Membership {
    id: ID
    userId: Int
    user: User
    plan: PlanType
    startDate: String
    endDate: String
}

type SubscriptionStripePaymentTpe {
  clientSecret: String
  subscriptionId: String
}
   
 extend type Query {
        getAllPlans: [PlanType]
        getAllSubscriptions: [Membership]
    }
  
  type Mutation {
        buyPlan(planId: Int!, gateway: String): Boolean
        buyPlanWithStripe(planId: Int!, gateway: String, gatewayPayload:String): SubscriptionStripePaymentTpe
        connectStripePlanWithLocalPlan(planId:Int!): Boolean
    }
`;

const resolvers = {
  Query: {
    getAllPlans: async (root: any, args: any, context: MyContext) => {
      return await prisma.plan.findMany({
        include: {
          settings: true,
        },
      });
    },
    getAllSubscriptions: async (root: any, args: any, context: MyContext) => {
      return await prisma.membership.findMany({
        include: {
          user: {
            select: {
              name: true,
              avatar: true,
              email: true,
              id: true,
            },
          },
          plan: true,
        },
      });
    },
  },
  Mutation: {
    connectStripePlanWithLocalPlan: async (
      root: any,
      args: any,
      context: MyContext
    ) => {
      return await connectStripePlanWithLocalPlan(args.planId);
    },
    buyPlan: async (root: any, args: any, context: MyContext) => {
      const plan = await prisma.plan.findFirst({
        where: {
          id: args.planId,
        },
        include: {
          settings: true,
        },
      });

      const user = await prisma.user.findUnique({
        where: {
          id: context.user.id,
        },
        include: {
          UserSetting: true,
        },
      });

      if (plan && user) {
        let months = 0;

        switch (plan.type) {
          case "month":
            months = 1;
            break;
          case "year":
            months = 12;
            break;

          default:
            months = 1;
            break;
        }

        await updateMembership(prisma, context.user.id, plan.id, months);

        return true;
      } else {
        throw new Error("Plan not found");
      }
    },
    buyPlanWithStripe: async (root: any, args: any, context: MyContext) => {
      const plan = await prisma.plan.findFirst({
        where: {
          id: args.planId,
        },
        include: {
          settings: true,
        },
      });

      const user = await prisma.user.findUnique({
        where: {
          id: context.user.id,
        },
        include: {
          UserSetting: true,
        },
      });

      if (plan && user) {
        if (args.gateway === "stripe") {
          return await createStripeSubscription(
            plan,
            user,
            args.gatewayPayload
          );
        }
        // let months = 0;

        // switch (plan.type) {
        //   case "month":
        //     months = 1;
        //     break;
        //   case "year":
        //     months = 12;
        //     break;

        //   default:
        //     months = 1;
        //     break;
        // }
        return {
          clientSecret: "",
          subscriptionId: "",
        };
        // await updateMembership(prisma, context.user.id, plan.id, months);
      } else {
        throw new Error("Plan not found");
      }
    },
  },
};

export { typeDefs, resolvers };
