import { createPaymentsServicesByDefault } from "../facades/paymentFacade.js";
import { MyContext } from "../types/MyContextInterface";
import { Prisma, PrismaClient, UserType } from "@prisma/client";

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
    getAdminUsers(
      offset: Int,
      limit: Int,
      type: String,
      search: String
    ): [User],
    getSuperAdminSettings: [SuperAdminSettingType],
    getPaymentsSettings: [SuperAdminSettingType],
    getLanguages: [Language],
    getPermissions: [Permission],
    getRoles: [Role],
    getPlans: [Plan],
    getKpis(period: Int): [Kpi],
  }

type Mutation {
    createLanguage(
      name: String,
      lng: String
    ): Language,
    saveAdminSetting(
      settings: [SuperAdminSetting],
    ): Boolean,
    createPlan(
      planId: Int
      name: String
      interval: String
      price: Float
      description: String
    ): Language,
    deletePlan(planId: Int): Boolean
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
    getAdminUsers: async (
      root: any,
      args: { offset: any; limit: any; type: UserType; search: string },
      context: MyContext
    ) => {
      let typeSelected: Prisma.UserWhereInput;

      typeSelected = {};

      if (args.search) {
        typeSelected = {
          OR: [
            {
              username: {
                contains: args.search,
              },
              name: {
                contains: args.search,
              },
            },
          ],
        };
      }

      const users = await prisma.user.findMany({
        where: {
          type: args.type,
          ...typeSelected, // Combina el filtro de búsqueda con el filtro de tipo
        },
        include: {
          refer: {
            include: {
              refer: {
                select: {
                  username: true,
                  avatar: true,
                  country: true,
                  state: true,
                  city: true,
                },
              },
            },
          },
          UserStatus: true,
          Membership: {
            select: {
              endDate: true,
            },
          },
          Language: true,
          UserSetting: true,
          amounts: {
            include: {
              currency: true,
            },
          },
          _count: {
            select: {
              refer: true,
            },
          },
        },
      });

      return users;
    },
    getSuperAdminSettings: async (root: any, args: {}, context: MyContext) => {
      const settings = await prisma.superAdminSetting.findMany({});

      return settings;
    },
    getPaymentsSettings: async (root: any, args: {}, context: MyContext) => {
      const settings = await prisma.superAdminSetting.findMany({ where: {
        settingName: {
          in: ['QVAPAY_CLIENT_ENABLED','QVAPAY_MODE','STRIPE_CLIENT_ENABLED','STRIPE_MODE']
        }
      } });

      return settings;
    },
    getKpis: async (root: any, args: any, context: MyContext) => {
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

      //Parse date to string - by Ts

      const parsedKpis = kpis.map((kpi) => {
        const createdAt = kpi.createdAt.toLocaleDateString();
        // Puedes realizar conversiones adicionales o manipular otras propiedades aquí si es necesario
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
      const permissions = await prisma.permission.findMany({});
      return permissions;
    },
    getRoles: async (root: any, args: any, context: MyContext) => {
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
      const language = await prisma.language.create({
        data: {
          name: args.name,
          lng: args.lng,
        },
      });
      return language;
    },
    deletePlan: async (root: any, args: any, context: MyContext) => {
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
    saveAdminSetting: async (root: any, args: any, context: MyContext) => {
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

              createPaymentsServicesByDefault(setting.settingName);
            }
          })
        );
        return true;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    createRole: async (root: any, args: any, context: MyContext) => {
      const role = await prisma.role.create({
        data: {
          name: args.name,
          description: args.description,
        },
      });
      return role;
    },
    createPlan: async (root: any, args: any, context: MyContext) => {
      await prisma.plan.upsert({
        where: {
          id: args.planId ? args.planId : 0,
        },
        update: {
          name: args.name,
          type: args.interval,
          price: args.price,
          description: args.description,
        },
        create: {
          name: args.name,
          type: args.interval,
          price: args.price,
          description: args.description,
        },
      });
    },
    createPermission: async (root: any, args: any, context: MyContext) => {
      const permission = await prisma.permission.create({
        data: {
          name: args.name,
          description: args.description,
        },
      });
      return permission;
    },
    associateAcl: async (_, args) => {
      try {
        let model = null;

        if (args.model === "User") {
          model = await prisma.user.findUnique({
            where: { id: args.modelId },
          });
        }

        if (args.model === "Permission") {
          model = await prisma.permission.findUnique({
            where: { id: args.modelId },
          });
        }

        if (args.model === "Plan") {
          model = await prisma.plan.findUnique({
            where: { id: args.modelId },
          });
        }

        if (args.model === "Role") {
          model = await prisma.role.findUnique({
            where: { id: args.modelId },
          });
        }

        if (!model) {
          return false;
        }

        // Realiza las operaciones necesarias para asociar los modelos
        if (args.model === "User" && args.modelToAssociate === "Role") {
          const userRole = await prisma.userRole.create({
            data: {
              userId: model.id,
              roleId: args.modelToAssociateId,
            },
          });
        } else if (
          args.model === "User" &&
          args.modelToAssociate === "Permission"
        ) {
          const userPermission = await prisma.userPermission.create({
            data: {
              userId: model.id,
              permissionId: args.modelToAssociateId,
            },
          });
        } else if (
          args.model === "Permission" &&
          args.modelToAssociate === "Role"
        ) {
          const rolePermission = await prisma.rolePermission.create({
            data: {
              permissionId: model.id,
              roleId: args.modelToAssociateId,
            },
          });
        } else if (
          args.model === "Plan" &&
          args.modelToAssociate === "Permission"
        ) {
          const rolePermission = await prisma.planPermission.create({
            data: {
              planId: model.id,
              permissionId: args.modelToAssociateId,
            },
          });
        } else if (
          args.model === "Role" &&
          args.modelToAssociate === "Permission"
        ) {
          const rolePermission = await prisma.rolePermission.create({
            data: {
              roleId: model.id,
              permissionId: args.modelToAssociateId,
            },
          });
        }

        return true;
      } catch (error) {
        console.log(error.message);

        throw new Error(error.message);
      }
    },
  },
};

export { typeDefs, resolvers };
