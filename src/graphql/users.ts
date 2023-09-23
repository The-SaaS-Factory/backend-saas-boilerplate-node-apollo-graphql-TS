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
    login: async (
      root: any,
      args: { email: Prisma.StringFilter; password: string }
    ) => {
      let userFind: Prisma.UserFindFirstArgs;

      userFind = {
        where: {
          email: args.email,
        },
        include: {
          UserPermission: {
            select: {
              permission: true,
            },
          },
          UserRole: {
            select: {
              role: true,
            },
          },
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
      };

      const user = await prisma.user.findFirst(userFind);
      //Decrypt password before compare with bcrypt

      if (!user || !bcrypt.compareSync(args.password, user.password)) {
        throw new Error("Invalid credentials");
      }

      const userForToken = {
        username: user.username,
        id: user.id,
      };

      return { token: jwt.sign(userForToken, env.JWT_SECRET), user: user };
    },

    createUser: async (root: any, args: any, { prisma }) => {
      try {
        return await prisma.$transaction(async (tx) => {
          const { email, username, password, sponsor, lang } = args;

          // Check if email is already taken
          const existingUser = await tx.user.findFirst({
            where: {
              email,
            },
          });

          if (existingUser) {
            throw new Error("email_registered");
          }

          const [langBase] = lang ? lang.split("-") : "en";

          let languageId = 1;

          if (lang) {
            switch (langBase) {
              case "pt":
                languageId = 3;
                break;

              case "es":
                languageId = 2;
                break;

              default:
                languageId = 1;
                break;
            }
          }

          let name = username;
          let newUserName = await generateUniqueUsername(tx, name);

          const user = await tx.user.create({
            data: {
              email,
              name,
              languageId,
              username: newUserName,
              password: bcrypt.hashSync(password, 10),
            },
          });

          if (user && sponsor) {
            const referringUser = await tx.user.findUnique({
              where: {
                id: sponsor,
              },
              include: {
                Membership: true,
              },
            });

            if (referringUser) {
              const referral = await tx.referral.create({
                data: {
                  refer: {
                    connect: {
                      id: referringUser.id,
                    },
                  },
                  referred: {
                    connect: {
                      id: user.id,
                    },
                  },
                },
              });
            }
          }

          //Marketing actions on register
          checkMarketingActionsForNewUser(user);

          if (user) {
            const userForToken = {
              username: user.username,
              id: user.id,
            };

            sendWelcomeEmail(user);
            return {
              token: jwt.sign(userForToken, env.JWT_SECRET, {
                expiresIn: "7d",
              }),
              user: user,
            };
          }
        });
      } catch (error) {
        throw new Error(error.message);
      }
    },
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
    forgotPassword: async (root: any, args: { email: string }) => {
      try {
        const user = await prisma.user.findFirst({
          where: {
            email: args.email,
          },
        });

        if (!user) {
          throw new Error("Email not found");
        }

        let resetCode = generateSecureResetCode();
        let resetCodeExpires = new Date(Date.now() + 1800000);

        const updateUser = await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            resetCode: resetCode,
            resetCodeExpires: resetCodeExpires,
          },
        });

        if (updateUser) {
          sendResetCodeEmail(updateUser.email, resetCode);
        }
      } catch (error) {
        throw new Error(error.message);
      }
    },
    checkResetCode: async (
      root: any,
      args: { email: string; resetCode: string }
    ) => {
      try {
        const user = await prisma.user.findFirst({
          where: {
            email: args.email,
          },
        });

        if (!user) {
          throw new Error("Email not found");
        }

        if (user.resetCode !== args.resetCode) {
          throw new Error("Invalid reset code");
        }

        if (user.resetCodeExpires < new Date()) {
          throw new Error("Reset code has expired");
        }

        // Si todo está bien, devuelve el ID del usuario
        return { userId: user.id };
      } catch (error) {
        throw new Error(error.message);
      }
    },
    updatePasswordByEmail: async (
      root: any,
      args: { userId: number; newPassword: string },
      MyContext
    ) => {
      try {
        const user = await prisma.user.update({
          where: {
            id: args.userId,
          },
          data: {
            password: bcrypt.hashSync(args.newPassword, 3),
          },
        });
      } catch (error) {
        throw new Error(
          traslate("UnableToChangePassword", args.userId ? args.userId : 1, {})
        );
      }
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
