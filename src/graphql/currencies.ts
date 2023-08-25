import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const typeDefs = `#graphql
    type CurrencyType {
    id: Int,
    name: String
    code: String
    rate: Float
  }
  extend type Query {
    getCurrencies: [CurrencyType]
  }
  extend type Mutation {
    createCurrency(
     name: String,
     code: String,
     rate: Int,
    ): CurrencyType
  }
  `;

const resolvers = {
  Query: {
    getCurrencies: async (root: any, args: { id: number }) => {
      return prisma.adminCurrencies.findMany();
    },
  },
  Mutation: {
    createCurrency: async (root: any, args: any) => {
      return await prisma.adminCurrencies.create({
        data: {
          name: args.name,
          code: args.code,
          rate: args.rate,
        },
      });
    },
  },
};

export { typeDefs, resolvers };
