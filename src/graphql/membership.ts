import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

import { MyContext } from "../types/MyContextInterface";
 
import {
  getInvoiceByModelAndModelId,
  propagateCapabilitiesFromPlanToUser,
  propagateCapabilitiesOnAsociateWithPlanNewCapabilitie,
  updateMembership,
} from "../facades/membershipFacade.js";
import {
  connectStripePlanWithLocalPlan,
  createStripeSubscription,
} from "../facades/paymentFacade.js";

const typeDefs = `#graphql

type PlanType {
    id: ID
    name: String
    type: String
    price: Float
    description: String
    settings: [PlanSettingType]
    PlanCapabilities: [PlanCapabilitieType]
    }
type CapabilitieType {
    id: ID
    name: String
    type: String
    description: String
     
    }
type PlanCapabilitieType {
    id: ID
    planId: Int
    capabilitieId: Int
    count: Int 
    name: String
    capabilitie: CapabilitieType   
   
    }

    type UserCapabilitieType {
      count: Int
      userId: Int
      capabilitieId: Int
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
    invoice: InvoiceType
}

type SubscriptionStripePaymentTpe {
  clientSecret: String
  subscriptionId: String
}
   
 extend type Query {
        getAllPlans: [PlanType]
        getAllCapabilities: [CapabilitieType]
        getAllSubscriptions: [Membership]
    }
  
  type Mutation {
        buyPlan(planId: Int!, gateway: String): Boolean
        buyPlanWithStripe(planId: Int!, gateway: String, gatewayPayload:String!): SubscriptionStripePaymentTpe
        connectStripePlanWithLocalPlan(planId:Int!): Boolean
        connectCapabilitieWithPlan(planId:Int!,capabilitieId:Int!, count: Int, name: String): PlanCapabilitieType
        createCapabilitie(name: String!, description:String, type: String): CapabilitieType
        deleteCapabilitie(capabilitieId: Int!): Boolean
    }
`;

const resolvers = {
  Query: {
    getAllPlans: async (root: any, args: any, context: MyContext) => {
      return await prisma.plan.findMany({
        include: {
          settings: true,
          PlanCapabilities: {
            include: {
              capabilitie: true,
            },
            orderBy: {
              capabilitieId: "asc",
            },
          },
        },
      });
    },
    getAllCapabilities: async (root: any, args: any, context: MyContext) => {
      return await prisma.capabilitie.findMany();
    },
    getAllSubscriptions: async (root: any, args: any, context: MyContext) => {
      const memberships = await prisma.membership.findMany({
        include: {
          user: {
            select: {
              name: true,
              avatar: true,
              email: true,
              username: true,
              id: true,
            },
          },
          plan: true,
        },
      });

      const membershipsWithInvoices = await Promise.all(
        memberships.map(async (membership: any) => {
          const invoice = await getInvoiceByModelAndModelId(
            "MEMBERSHIP",
            membership.id
          );

          return (membership.invoice = invoice);
        })
      );

      return memberships;
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
    connectCapabilitieWithPlan: async (
      root: any,
      args: any,
      context: MyContext
    ) => {
      try {
        const oldConection = await prisma.planCapabilities.findFirst({
          where: {
            capabilitieId: args.capabilitieId,
            planId: args.planId,
          },
        });

        !oldConection &&
          propagateCapabilitiesOnAsociateWithPlanNewCapabilitie(args.planId);

        return await prisma.planCapabilities.upsert({
          where: {
            id: oldConection ? oldConection.id : 0,
          },
          update: {
            count: args.count,
            name: args.name,
          },
          create: {
            capabilitieId: args.capabilitieId,
            planId: args.planId,
            count: args.count,
            name: args.name,
          },
        });
      } catch (error) {
        throw new Error(error.message);
      }
    },
    createCapabilitie: async (root: any, args: any, context: MyContext) => {
      try {
        return await prisma.capabilitie.create({
          data: {
            name: args.name,
            type: args.type,
            description: args.description,
          },
        });
      } catch (error) {
        throw new Error(error.message);
      }
    },
    deleteCapabilitie: async (root: any, args: any, context: MyContext) => {
      try {
        await prisma.capabilitie.delete({
          where: {
            id: args.capabilitieId,
          },
        });

        return true;
      } catch (error) {
        throw new Error(error.message);
      }
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

        await updateMembership(prisma, context.user.id, plan.id, months, false);

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
