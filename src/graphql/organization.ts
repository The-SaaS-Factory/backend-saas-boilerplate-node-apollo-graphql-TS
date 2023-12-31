import { PrismaClient } from "@prisma/client";
import { MyContext } from "../types/MyContextInterface";
import { checkPermission } from "../facades/scurityFacade.js";

const prisma = new PrismaClient();
const typeDefs = `#graphql
   type OrganizationType {
        id: ID
        name: String
        externalId: String
        externalAttributes: String
        userId: Int
        user: User
        createdAt: String
        updatedAt: String
        OrganizationSetting: [OrganizationSettingType]
        Invoice: [InvoiceType]
        Membership: Membership
        Permission: [PermissionType]
        OrganizationCapabilities: [OrganizationCapabilitiesType]
    }

    type OrganizationSettingType {
        id: ID
        organizationId: Int
        settingName: String
        settingValue: String
    }

    type OrganizationCapabilitiesType {
        id: ID
        organizationId: Int
        capabilitieId: Int
        count: Int
        organization: OrganizationType
        capabilitie: CapabilitieType
    }

    extend type Query {
        getAllOrganizations: [OrganizationType]
        getAllOrganizationsWithPermissions: [OrganizationType]
        getOrganizationCapabilies(organizationId: Int): [OrganizationCapabilitiesType]
    }
`;

const resolvers = {
  Query: {
    getOrganizationCapabilies: async (
      root: any,
      args: any,
      context: MyContext
    ) => {
      checkPermission(context.user.permissions, "superAdmin:administration:read");
      return await prisma.organizationCapabilities.findMany({
        where: {
          organizationId: args.organizationId,
        },
      });
    },
    getAllOrganizations: async (root: any, args: any, context: MyContext) => {
       checkPermission(context.user.permissions, "superAdmin:administration:read");  
      return await prisma.organization.findMany({
        include: {
          user: true,
          Membership: {
            include: {
              plan: true,
            },
          },
          Permission: true,
        },
      });
    },
    getAllOrganizationsWithPermissions: async (
      root: any,
      args: any,
      context: MyContext
    ) => {
       checkPermission(context.user.permissions, "superAdmin:administration:read");  
      return await prisma.organization.findMany({
        where: {
          Permission: {
            some: {},  
          },
        },
        include: {
          user: true,
          Membership: {
            include: {
              plan: true,
            },
          },
          Permission: true,
        },
      });
    },
  },
  Mutation: {},
};

export { typeDefs, resolvers };
