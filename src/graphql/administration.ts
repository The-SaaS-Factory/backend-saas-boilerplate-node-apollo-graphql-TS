import { checkPermission } from "../facades/aclFacade.js";
import { associateAclFacade } from "../facades/adminFacade.js";
import { MyContext } from "../types/MyContextInterface";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const typeDefs = `#graphql
 type Language {
    id: ID! 
    name: String
    lng: String
} 

 type Permission {
    id: ID!
    name: String
    description: String
} 
 type Plan {
    id: ID!
    name: String
    type: String
    description: String
    price:Float
    oldPrice: Float
    status: String
    Permission: [PlanPermission]
} 
 type Role {
    id: ID!
    name: String
    description: String
    RolePermission: [RolePermission]
} 
 
 type RolePermission {
    id: ID!
    roleId: Int
    permissionId: Int
} 
 type PlanPermission {
    id: ID!
    planId: Int
    permissionId: Int
    permission: Permission
} 
 type PlanPermission {
    id: ID!
    planId: Int
    permissionId: Int
    permission: Permission
} 
 
 type FrontendComponent {
    id: ID!
    name: String
    type: String
    data: String
    description: String
    Language: Language
} 
 
 type UserRole {
    id: ID!
    userId: Int
    roleId: Int
    role: Role
} 

 type UserPermission {
    id: ID!
    userId: Int
    permissionId: Int
    permission: Permission
} 

  type Kpi {
    id: ID!
    name: String
    type: String
    value: Float
    createdAt: String
    updatedAt: String
  }
    
  type SuperAdminSettingType {
    settingName: String
    settingValue: String
  }
  input SuperAdminSetting {
    settingName: String
    settingValue: String
    }


type Query {
    getSuperAdminSettings: [SuperAdminSettingType],
    getPaymentsSettings: [SuperAdminSettingType],
    getSocialMediaLinks: [SuperAdminSettingType],
    getPlatformGeneralData: [SuperAdminSettingType],
    getLanguages: [Language],
    getPermissions: [Permission],
    getRoles: [Role],
    getPlans: [Plan],
    getKpis(period: Int): [Kpi],
  }

type Mutation {
    createFrontendCoponent(id: Int, name: String, data: String, action: String): Boolean
    createLanguage(
      name: String,
      lng: String
    ): Language,
    saveAdminSetting(
      settings: [SuperAdminSetting],
    ): Boolean,
  
    deletePlan(planId: Int): Boolean
    deleteLanguage(languageId: Int!): Boolean
    createRole(
      name: String,
      description: String
    ): Role,
    createPermission(
      name: String,
      description: String
    ): Permission,
    associateAcl(
      model: String
      modelId: Int
      modelToAssociate: String
      modelToAssociateId: Int
    ): Boolean
    }
`;

const resolvers = {
  Query: {
    getSuperAdminSettings: async (root: any, args: {}, context: MyContext) => {
      checkPermission(context.user.permissions, "settings:read");
      return await prisma.superAdminSetting.findMany({});
    },
    getPaymentsSettings: async (root: any, args: {}, context: MyContext) => {
      checkPermission(context.user.permissions, "settings:read");
      const settings = await prisma.superAdminSetting.findMany({
        where: {
          settingName: {
            in: [
              "QVAPAY_CLIENT_ENABLED",
              "QVAPAY_MODE",
              "STRIPE_CLIENT_ENABLED",
              "STRIPE_MODE",
              "STRIPE_CLIENT_PK_PRODUCTION",
              "STRIPE_CLIENT_PK_SANDBOX",
            ],
          },
        },
      });
      return settings;
    },
    getSocialMediaLinks: async (root: any, args: {}, context: MyContext) => {
      const settings = await prisma.superAdminSetting.findMany({
        where: {
          settingName: {
            in: [
              "LINK_FACEBOOK",
              "LINK_INSTAGRAM",
              "LINK_TWITTER",
              "LINK_GITHUB",
              "LINK_YOUTUBE",
            ],
          },
        },
      });

      return settings;
    },
    getPlatformGeneralData: async (root: any, args: {}, context: MyContext) => {
      const settings = await prisma.superAdminSetting.findMany({
        where: {
          settingName: {
            in: [
              "PLATFORM_NAME",
              "PLATFORM_FAVICON",
              "PLATFORM_LOGO",
              "PLATFORM_RESUME",
              "DOC_EXTERNAL_LINK",
              "DOC_EXTERNAL_LINK",
              "PLATFORM_DEMO_URL",
              "PLATFORM_DOC_URL",
            ],
          },
        },
      });

      return settings;
    },
    getKpis: async (root: any, args: any, context: MyContext) => {
      checkPermission(context.user.permissions, "dashboard:read");
      const period = args.period || 1;
      const kpis = await prisma.adminKpi.findMany({
        where: {
          createdAt: {
            gte: new Date(new Date().getTime() - period * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      const parsedKpis = kpis.map((kpi) => {
        const createdAt = kpi.createdAt.toLocaleDateString();
        return {
          ...kpi,
          createdAt: createdAt,
        };
      });

      return parsedKpis;
    },
    getLanguages: async (root: any, args: any, context: MyContext) => {
      const languages = await prisma.language.findMany({});
      return languages;
    },
    getPlans: async (root: any, args: any, context: MyContext) => {
      const plans = await prisma.plan.findMany({
        include: {
          Permission: {
            include: {
              permission: true,
            },
          },
        },
      });
      return plans;
    },
    getPermissions: async (root: any, args: any, context: MyContext) => {
      checkPermission(context.user.permissions, "settings:read");
      const permissions = await prisma.permission.findMany({});
      return permissions;
    },
    getRoles: async (root: any, args: any, context: MyContext) => {
      checkPermission(context.user.permissions, "settings:read");
      const roles = await prisma.role.findMany({
        include: {
          RolePermission: true,
        },
      });
      return roles;
    },
  },
  Mutation: {
    createLanguage: async (root: any, args: any, context: MyContext) => {
      checkPermission(context.user.permissions, "settings:write");
      const language = await prisma.language.create({
        data: {
          name: args.name,
          lng: args.lng,
        },
      });
      return language;
    },
    deletePlan: async (root: any, args: any, context: MyContext) => {
      checkPermission(context.user.permissions, "settings:write");
      try {
        await prisma.plan.delete({
          where: {
            id: args.planId,
          },
        });
        return true;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    deleteLanguage: async (root: any, args: any, context: MyContext) => {
      checkPermission(context.user.permissions, "settings:write");
      try {
        const count = await prisma.language.count();

        if (count === 1) {
          throw new Error(
            "You cannot delete all languages, there must be at least 1"
          );
        }
        await prisma.language.delete({
          where: {
            id: args.languageId,
          },
        });
        return true;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    saveAdminSetting: async (root: any, args: any, context: MyContext) => {
      checkPermission(context.user.permissions, "settings:write");
      try {
        await Promise.all(
          args.settings.map(async (setting) => {
            const existingSetting = await prisma.superAdminSetting.findFirst({
              where: {
                settingName: setting.settingName,
              },
            });

            if (existingSetting) {
              await prisma.superAdminSetting.update({
                where: { id: existingSetting.id },
                data: { settingValue: setting.settingValue },
              });
            } else {
              await prisma.superAdminSetting.create({
                data: {
                  settingName: setting.settingName,
                  settingValue: setting.settingValue,
                },
              });
            }
          })
        );
        return true;
      } catch (error) {
        return {
          errors: [error],
        };
      }
    },
    createRole: async (root: any, args: any, context: MyContext) => {
      checkPermission(context.user.permissions, "settings:write");
      const role = await prisma.role.create({
        data: {
          name: args.name,
          description: args.description,
        },
      });
      return role;
    },
    createPermission: async (root: any, args: any, context: MyContext) => {
      checkPermission(context.user.permissions, "settings:write");
      const permission = await prisma.permission.create({
        data: {
          name: args.name,
          description: args.description,
        },
      });
      return permission;
    },
    associateAcl: async (_, args, context: MyContext) => {
      checkPermission(context.user.permissions, "settings:write");
      try {
        await associateAclFacade(args);

        return true;
      } catch (error) {
        console.log(error.message);

        throw new Error(error.message);
      }
    },
  },
};

export { typeDefs, resolvers };
