import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

import { MyContext } from "../types/MyContextInterface";

import {
  getInvoiceByModelAndModelId,
  propagateCapabilitiesFromPlanToUser,
  propagateCapabilitiesOnAsociateWithPlanNewCapabilitie,
  updateMembership,
} from "../facades/membershipFacade.js";
import { connectStripePlanWithLocalPlan } from "../facades/paymentFacade.js";

const typeDefs = `#graphql

type PlanType {
    id: ID
    name: String
    type: String
    price: Float
    oldPrice: Float
    status: String
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
    organizationId: Int
    organization: OrganizationType
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
        getPlanByName(name: String!): PlanType
    }
  
  type Mutation {
        createPlan(
          planId: Int
          name: String
          type: String
          price: Float
          oldPrice: Float
          status: String
          description: String
        ): Plan,
        connectStripePlanWithLocalPlan(planId:Int!): Boolean
        disconectStripePlanWithLocalPlan(planId:Int!): Boolean
        connectCapabilitieWithPlan(planId:Int!,capabilitieId:Int!, count: Int, name: String): PlanCapabilitieType
        createCapabilitie(name: String!, description:String, type: String): CapabilitieType
        deleteCapabilitie(capabilitieId: Int!): Boolean
    }
`;

const resolvers = {
  Query: {
    getPlanByName: async (root: any, args: any, context: MyContext) => {
      return await prisma.plan.findFirst({
        where: {
          name: args.name,
        },
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
      try {
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
            organization: {
              select: {
                name: true,
                id: true,
              },
            },
            plan: true,
          },
        });

        const membershipsWithInvoices = await Promise.all(
          memberships.map(async (membership: any) => {
            const invoice = await getInvoiceByModelAndModelId(
              "membership",
              membership.id
            );

            return (membership.invoice = invoice);
          })
        );

        return memberships;
      } catch (error) {
        console.log(error);
        
        throw new Error(error.message);
      }
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
    disconectStripePlanWithLocalPlan: async (
      root: any,
      args: any,
      context: MyContext
    ) => {
      await prisma.planSetting.deleteMany({
        where: {
          planId: args.planId,
          settingName: "STRIPE_PLAN_ID",
        },
      });
      return true;
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

        //For all users and organizations with membership with this plan, propagate the new capabilities
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
    createPlan: async (root: any, args: any, context: MyContext) => {
      await prisma.plan.upsert({
        where: {
          id: args.planId ? args.planId : 0,
        },
        update: {
          name: args.name,
          type: args.type,
          price: args.price,
          description: args.description,
          oldPrice: args.oldPrice,
          status: args.status,
        },
        create: {
          name: args.name,
          type: args.type,
          price: args.price,
          description: args.description,
          oldPrice: args.oldPrice,
          status: args.status,
        },
      });
    },
  },
};

export { typeDefs, resolvers };
