import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

import { MyContext } from "../types/MyContextInterface";
import { MovementType } from "../types/MovementsTypes";
import { newMovement } from "../facades/movementsAmounts.js";

const typeDefs = `#graphql

type MovementType {
    amount: Float
    currencyId: CurrencyType
    model: String
    modelId: Int
    details: String
    type: String
    status: String
  }
   
 extend type Query {
    getMovementsForUser: [MovementType]
    }
  
  type Mutation {
        buyPlan(planId: Int!): Boolean
    }
`;

const resolvers = {
  Query: {
    getMovementsForUser: async (root: any, args: any, context: MyContext) => {
      return await prisma.adminMovementsAmounts.findMany({
        where: {
          modelId: context.user.id,
        },
        include: {
          currency: true,
        },
      });
    },
  },
  Mutation: {},
};

export { typeDefs, resolvers };
