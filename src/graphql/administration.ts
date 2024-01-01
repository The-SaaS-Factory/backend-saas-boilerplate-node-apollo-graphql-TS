import { checkPermission } from "../facades/scurityFacade.js";
import { MyContext } from "../types/MyContextInterface";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const typeDefs = `#graphql
 type Language {
    id: ID! 
    name: String
    lng: String
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
 
 
 type PlanPermission {
    id: ID!
    planId: Int
    permissionId: Int
    permission: PermissionType
} 
 type PlanPermission {
    id: ID!
    planId: Int
    permissionId: Int
    permission: PermissionType
} 

 type UserPermission {
    id: ID!
    userId: Int
    permissionId: Int
    permission: PermissionType
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
    }
`;

const resolvers = {
  Query: {
    getSuperAdminSettings: async (root: any, args: {}, context: MyContext) => {
      checkPermission(context.user.permissions, "superAdmin:settings:read");
      return await prisma.superAdminSetting.findMany({});
    },
    getPaymentsSettings: async (root: any, args: {}, context: MyContext) => {
      checkPermission(context.user.permissions, "superAdmin:settings:read");
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
      checkPermission(context.user.permissions, "superAdmin:administration:read");
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
          Permission: true,
        },
      });
      return plans;
    },
  },
  Mutation: {
    createLanguage: async (root: any, args: any, context: MyContext) => {
      checkPermission(context.user.permissions, "superAdmin:settings:write");
      const language = await prisma.language.create({
        data: {
          name: args.name,
          lng: args.lng,
        },
      });
      return language;
    },
    deletePlan: async (root: any, args: any, context: MyContext) => {
      checkPermission(context.user.permissions, "superAdmin:settings:write");
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
      checkPermission(context.user.permissions, "superAdmin:settings:write");
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
      checkPermission(context.user.permissions, "superAdmin:settings:write");
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
  },
};

export { typeDefs, resolvers };
