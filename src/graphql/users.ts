import bcrypt from "bcryptjs";
import { PrismaClient, Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import { MovementType } from "../types/MovementsTypes";
import { withFilter } from "graphql-subscriptions";
import { MyContext } from "../types/MyContextInterface";
import {
  generateSecureResetCode,
  generateUniqueUsername,
} from "../facades/authFacade.js";
import { traslate } from "../facades/strFacade.js";
import pubsub from "../facades/pubSubFacade.js";
import {
  checkSettingAction,
  createDefaultSettingForuser,
} from "../facades/userFacade.js";
import { checkMarketingActionsForNewUser } from "../facades/marketingFacade.js";
import { sendResetCodeEmail, sendWelcomeEmail } from "../facades/mailFacade.js";
import { env } from "process";

const prisma = new PrismaClient();

const typeDefs = `#graphql

type Avatar {
    id: ID!
    url: String
  }

        input UserLoginInput {
        email: String!
        password: String!
        }

    input UserCreateInput {
        username: String!
        email: String!
        password: String!
    }

    type CurrencyType {
     id: Int,
     name: String,
     code: String,
    }
    
    type UserAmount {
        id: Int,
        amount: Float
        currency: CurrencyType
    }
    
  
  type NewUserType {
    user:  User!,
    token: String!
  }

    
 type Refer {
  refer: User
  }

  
    type Avatar {
      id:  ID!
      url: String
    }
    type Language {
      id:  ID!
      name: String
    }
  
    type User {
      id:  ID,
      email: String,
      avatar: String,
      phone: String,
      resume: String,
      cover: String,
      city: String,
      sponsor: Int,
      state: String,
      country: String,
      avatar_thumbnail: String,
      username:  String!,
      name:  String,
      refer: [Refer],
      amounts: [UserAmount],
      UserSetting: [Setting],
      Language: Language,
      UserStatus: [UserStatus]
      Membership: [Membership],
      UserRole: [UserRole]
      UserPermission: [UserPermission]
      UserCapabilities: [UserCapabilitieType]
  }
 

  type UserStatus {
    id: ID
    name: String
    description: String
    statusUntil: String
  }

  type CodeForChangePassword {
    userId: Int
   }
  type Token {
   token: String!
  }

  type Setting {
    id: Int
    userId: Int
    settingName: String
    settingValue: String
  }

  type Notification {
  id: ID!
  type: String,
  image: String,
  content: String!
  viewed: Boolean!
}

  type NotificationSub {
  userId: Int
  content: String
  notificationsCount: Int
  
}


 extend type Query {
 
    me: User,
    getUser(
     username: String!
    ): User, 
    getUsers(
      offset: Int,
      limit: Int,
      search: String
    ): [User],
    getUserSetting(userId: Int, settingName: String!): Setting
    getUserNotification(userId: Int): [Notification]
  }
  
  type Mutation {
    login(
      email: String!,
      password: String!
    ): NewUserType,
   
    markNotificationsAsRead: Boolean
    sendAdminNotification(userId: Int!, type: String, content: String): Notification
    createUser(username: String!, email: String!,password: String!, sponsor: Int, lang: String): NewUserType
    forgotPassword(email:String!): Boolean
    checkResetCode(email:String!,resetCode:String!): CodeForChangePassword
    updatePasswordByEmail(userId:Int!,newPassword:String!): Boolean
    updateUser(email: String,username: String, name: String, resume: String, password: String,avatar: String, cover: String,avatar_thumbnail: String, phone: String, country: String, state:String, city:String,languageId: Int): User
    saveSetting(
      settingName: String!
      settingValue: String!
    ): Setting
  }
 
  
  type Subscription {
    newInternalNotification(
      userId: Int!
      notificationsCount: Int
    ): NotificationSub
   }


`;

const resolvers = {
  Query: {
    me: (root: any, args: any, context: MyContext) => {
      return prisma.user.findUnique({
        where: { id: context.user.id },
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
              plan: {
                include: {
                  PlanCapabilities: {
                    include: {
                      capabilitie: true,
                    },
                  },
                },
              },
            },
          },
          UserCapabilities: true,
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
    },
    getUserNotification: async (_, { userId }, MyContext) => {
      try {
        const notifications = await prisma.notification.findMany({
          where: { userId: MyContext.user ? MyContext.user.id : userId },
          orderBy: { data: "desc" },
        });

        return notifications;
      } catch (error) {
        throw new Error("Failed to retrieve user notifications");
      }
    },
    getUser: async (root: any, args: { username: Prisma.StringFilter }) => {
      const user = await prisma.user.findFirst({
        where: {
          username: args.username,
        },
        include: {
          Membership: {
            select: {
              endDate: true,
              plan: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      return user;
    },
    getUsers: async (root: any, args: any) => {
      let typeSelected: Prisma.UserWhereInput;
      const limit = args.limit;
      const offset = args.offset;
      typeSelected = {};

      // if (args.search) {  //Fix this
      //   typeSelected = {
      //     OR: [
      //       {
      //         username: {
      //           contains: args.search,
      //         },
      //         name: {
      //           contains: args.search,
      //         },
      //       },
      //     ],
      //   };
      // }

      const users = await prisma.user.findMany({
        where: {
          ...typeSelected,
        },
        skip: offset,
        take: limit,
        include: {
          Membership: {
            select: {
              endDate: true,
              plan: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      return users;
    },
    getUserSetting: async (root: any, args: any, context: MyContext) => {
      const userSetting = await prisma.userSetting.findFirst({
        where: {
          userId: args.userId ?? context.user.id,
          settingName: args.settingName,
        },
      });

      return userSetting;
    },
  },
  Mutation: {
    
    markNotificationsAsRead: async (root: any, args: any, MyContext) => {
      try {
        const notifications = await prisma.notification.updateMany({
          where: {
            userId: MyContext.user.id,
            viewed: false,
          },
          data: {
            viewed: true,
          },
        });

        return true;
      } catch (error) {
        console.log(error.message);
        return false;
      }
    },
    updateUser: async (
      root: any,
      args: {
        email: string;
        username: string;
        name: string;
        password: string;
        avatar: string;
        cover: string;
        resume: string;
        avatar_thumbnail: string;
        phone: string;
        country: string;
        state: string;
        city: string;
        languageId?: number;
      },
      MyContext
    ) => {
      try {
        const dataToUpdate: any = {
          email: args.email || MyContext.user.email,
          name: args.name || MyContext.user.name,
          username: args.username || MyContext.user.username,
          resume: args.resume || MyContext.user.resume,
          password: args.password
            ? bcrypt.hashSync(args.password, 3)
            : MyContext.user.password,
          avatar: args.avatar || MyContext.user.avatar,
          cover: args.cover || MyContext.user.cover,
          avatar_thumbnail:
            args.avatar_thumbnail || MyContext.user.avatar_thumbnail,
          phone: args.phone || MyContext.user.phone,
          country: args.country || MyContext.user.country,
          state: args.state || MyContext.user.state,
          city: args.city || MyContext.user.city,
          languageId: args.languageId || MyContext.user.languageId,
        };

        const user = await prisma.user.update({
          where: {
            id: MyContext.user.id,
          },
          data: dataToUpdate,
        });

        return user;
      } catch (error) {
        console.log(error);
      }

      return null;
    },
   
   
   
    saveSetting: async (
      root: any,
      args: { settingName: string; settingValue: string },
      context: MyContext
    ) => {
      try {
        const existingSetting = await prisma.userSetting.findFirst({
          where: {
            userId: context.user.id,
            settingName: args.settingName,
          },
        });

        if (existingSetting) {
          // Actualizar el valor del ajuste existente
          const setting = await prisma.userSetting.update({
            where: { id: existingSetting.id },
            data: { settingValue: args.settingValue },
          });

          checkSettingAction(setting);

          return setting;
        } else {
          // Crear un nuevo ajuste
          const setting = await prisma.userSetting.create({
            data: {
              userId: context.user.id,
              settingName: args.settingName,
              settingValue: args.settingValue,
            },
          });

          checkSettingAction(setting);

          return setting;
        }
      } catch (error) {
        throw new Error(error.message);
      }
    },
  },
  Subscription: {
    newInternalNotification: {
      resolve: (payload, args, context, info) => {
        return payload;
      },
      subscribe: withFilter(
        () => pubsub.asyncIterator("NEW_INTERNAL_NOTIFICATION"),
        (payload, variables) => {
          return payload.userId === variables.userId;
        }
      ),
    },
  },
};

export { typeDefs, resolvers };
