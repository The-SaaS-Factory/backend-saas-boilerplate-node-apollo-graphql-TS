import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { MyContext } from "../types/MyContextInterface";
import { checkPermission } from "../facades/scurityFacade.js";

const typeDefs = `#graphql

type InvoiceType {
    id: Int
    userId: Int
    user: User
    organizationId: Int
    organization: OrganizationType
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
    getAllInvoices: [InvoiceType]
  }
`;

const resolvers = {
  Query: {
    getAllInvoices: async (root: any, args: any, context: MyContext) => {
      checkPermission(context.user.permissions, "superAdmin:billing:read");
      return await prisma.invoice.findMany({
        include: {
          user: true,
          organization: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    },
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
