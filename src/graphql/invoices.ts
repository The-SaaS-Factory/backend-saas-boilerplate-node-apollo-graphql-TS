import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

import { MyContext } from "../types/MyContextInterface";

const typeDefs = `#graphql

type InvoiceType {
    id: Int
    userId: Int
    user: User
    currency: CurrencyType
    currencyId: Int
    gateway: String
    gatewayId: String
    amount: Float
    invoiceUrl: String 
    invoicePdfUrl: String
    status: String
    createdAt: String
    updatedAt: String
    } 
   
 extend type Query {
        getUserInvoice(userId:Int!): [InvoiceType]
    }
  

`;

const resolvers = {
  Query: {
    getUserInvoice: async (root: any, args: any, context: MyContext) => {
      return await prisma.invoice.findMany({
        where: {
          userId: args.userId,
        },
        include: {
          currency: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    },
  },
  Mutation: {},
};

export { typeDefs, resolvers };
