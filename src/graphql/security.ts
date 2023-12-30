import { PrismaClient } from "@prisma/client";
import { MyContext } from "../types/MyContextInterface.js";
import { checkPermission } from "../facades/scurityFacade.js";
import { handleUpdateDataForOrganization } from "../facades/clerkFacade.js";

const prisma = new PrismaClient();

const typeDefs = `#graphql
  
    type ModuleType {
        id: Int
        name: String
        scope: String
        status: String
        description: String
        createdAt: String
        updatedAt: String
        Organization: [OrganizationType]
        Permission: [PermissionType]
    }

    type PermissionType {
        id: Int
        name: String
        description: String
        Module: [ModuleType]
        UserPermission: [User]
        Plan: [PlanType]
        Organization: [OrganizationType]
    }

  
  extend type Query {
    getModules: [ModuleType]
    getPermissions: [PermissionType]

  }

  type Mutation {
    addPermissionToModule(moduleId: Int!, permissionId: Int!): ModuleType
    removePermissionFromModule(moduleId: Int!, permissionId: Int!): ModuleType
    addOrganizationToModule(moduleId: Int!, organizationId: Int!): ModuleType
    removeOrganizationFromModule(moduleId: Int!, organizationId: Int!): ModuleType
  }
`;

const resolvers = {
  Query: {
    getModules: async (root: any, args: any, context: MyContext) => {
      checkPermission(context.user.permissions, "superAdmin:administration:read"); 
      return await prisma.module.findMany({
        include: {
          Permission: true,
          Organization: true,
        },
      });
    },
    getPermissions: async (root: any, args: any, context: MyContext) => {
      checkPermission(context.user.permissions, "superAdmin:administration:read"); 
      return await prisma.permission.findMany({
        include: {
          Module: true,
        },
      });
    },
  },
  Mutation: {
    addPermissionToModule: async (root: any, args: any, context: MyContext) => {
      checkPermission(context.user.permissions, "superAdmin:administration:read"); 
      return await prisma.module.update({
        where: {
          id: args.moduleId,
        },
        data: {
          Permission: {
            connect: {
              id: args.permissionId,
            },
          },
        },
      });
    },
    removePermissionFromModule: async (
      root: any,
      args: any,
      context: MyContext
    ) => {
      checkPermission(context.user.permissions, "superAdmin:administration:read");  
      return await prisma.module.update({
        where: {
          id: args.moduleId,
        },
        data: {
          Permission: {
            disconnect: {
              id: args.permissionId,
            },
          },
        },
      });
    },
    addOrganizationToModule: async (
      root: any,
      args: any,
      context: MyContext
    ) => {
      return prisma.$transaction(async (tx) => {
        checkPermission(context.user.permissions, "superAdmin:administration:read"); 
        const moduleOrganization = await tx.module.update({
          where: {
            id: args.moduleId,
          },
          data: {
            Organization: {
              connect: {
                id: args.organizationId,
              },
            },
          },
          include: {
            Organization: true,
            Permission: true,
          },
        });

        //Add module permission to organization
        const modulePermission = await tx.permission.findMany({
          where: {
            Module: {
              some: {
                id: args.moduleId,
              },
            },
          },
        });

        const organizationPermission = await tx.permission.findMany({
          where: {
            Organization: {
              some: {
                id: args.organizationId,
              },
            },
          },
        });

        const modulePermissionIds = modulePermission.map((p) => p.id);
        const organizationPermissionIds = organizationPermission.map(
          (p) => p.id
        );
        const permissionIds = modulePermissionIds.filter(
          (p) => !organizationPermissionIds.includes(p)
        );

        const permissions = await tx.permission.findMany({
          where: {
            id: {
              in: permissionIds,
            },
          },
        });

        await tx.organization.update({
          where: {
            id: args.organizationId,
          },
          data: {
            Permission: {
              connect: permissions,
            },
          },
        });

        const permissionsNames = permissions.map((p) => p.name);
       
        
        handleUpdateDataForOrganization({
          scope: "publicMetadata",
          organizationBdId: args.organizationId,
          data: {
            permissions: permissionsNames,
          },
        });

        return moduleOrganization;
      });
    },
    removeOrganizationFromModule: async (
      root: any,
      args: any,
      context: MyContext
    ) => {
      checkPermission(context.user.permissions, "superAdmin:administration:read");  
      return prisma.$transaction(async (tx) => {
        const moduleOrganization = await prisma.module.update({
          where: {
            id: args.moduleId,
          },
          data: {
            Organization: {
              disconnect: {
                id: args.organizationId,
              },
            },
          },
          include: {
            Organization: true,
          },
        });

        //Remove module permission from organization
        const modulePermission = await tx.permission.findMany({
          where: {
            Module: {
              some: {
                id: args.moduleId,
              },
            },
          },
        });

        const organizationPermission = await tx.permission.findMany({
          where: {
            Organization: {
              some: {
                id: args.organizationId,
              },
            },
          },
        });

        const modulePermissionIds = modulePermission.map((p) => p.id);
        const organizationPermissionIds = organizationPermission.map(
          (p) => p.id
        );
        const permissionIds = modulePermissionIds.filter((p) =>
          organizationPermissionIds.includes(p)
        );

        const permissions = await tx.permission.findMany({
          where: {
            id: {
              in: permissionIds,
            },
          },
        });

        const organizationUpdated = await tx.organization.update({
          where: {
            id: args.organizationId,
          },
          data: {
            Permission: {
              disconnect: permissions,
            },
          },
          include: {
            Permission: true,
          },
        });

        const permissionsNames = organizationUpdated.Permission?.map(
          (p) => p.name
        );

        handleUpdateDataForOrganization({
          scope: "publicMetadata",
          organizationBdId: args.organizationId,
          data: {
            permissions: permissionsNames,
          },
        });

        return moduleOrganization;
      });
    },
  },
};

export { typeDefs, resolvers };
