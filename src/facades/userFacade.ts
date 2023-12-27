import { PrismaClient, User } from "@prisma/client";
import { SettingType } from "../types/User";
import {
  checkMarketingActionsForNewUser,
  updateUserInEmailList,
} from "./marketingFacade.js";
import jwt from "jsonwebtoken";
import clerkClient from "@clerk/clerk-sdk-node";

const prisma = new PrismaClient();

export async function checkSettingAction(setting: SettingType) {
  if (setting.settingName === "newPlatformNotification") {
    const list = await prisma.marketingEmailLists.findFirst({
      where: {
        name: "newPlatformNotification",
      },
    });

    if (!list) {
      const listFinal = await prisma.marketingEmailLists.create({
        data: {
          name: "newPlatformNotification",
          type: "PLATFORM",
          userId: null,
        },
      });

      updateUserInEmailList(setting.userId, listFinal.id);
    } else {
      updateUserInEmailList(setting.userId, list.id);
    }
  }
}

export async function createDefaultSettingForuser(user: User) {
  const newPlatformNotification = await prisma.userSetting.create({
    data: {
      userId: user.id,
      settingName: "newPlatformNotification",
      settingValue: "1",
    },
  });

  checkSettingAction(newPlatformNotification);
}

export const getUser = async (token: string) => {
  try {
    const decodedToken: any = jwt.decode(token);
    const userId = decodedToken?.sub;

    //Get user from BD
    const user = await prisma.user.findFirst({
      where: {
        externalId: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      const userClerk = await clerkClient.users.getUser(userId);

      if (userClerk) {
        return await handleUserCreated(userClerk);
      }
    } else {
      return user;
    }
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
};

export const handleUserCreated = async (userData) => {
  let user = null;
  user = await prisma.user.findFirst({
    where: {
      externalId: userData.id,
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        externalId: userData.id,
        externalAttributes: JSON.stringify(userData),
        username: userData.username,
        email: userData.emailAddresses[0]?.emailAddress,
        name: userData.fullName || userData.firstName,
        phone: userData.primaryPhoneNumber,
        avatar: userData.imageUrl,
      },
    });

    // if (user.email) { //Fix this
    //   sendWelcomeEmail(user);
    // }

    checkMarketingActionsForNewUser("User", user.id);

    await createDefaultSettingForuser(user);

    return user;
  } else {
    return handleUserUpdated(userData);
  }
};

export const handleUserUpdated = async (userData) => {
  const user = await prisma.user.findFirst({
    where: {
      externalId: userData.id,
    },
  });

  if (user) {
    return await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        externalId: userData.id,
        externalAttributes: JSON.stringify(userData),
        username: userData.username,
        email: userData.emailAddresses[0]?.emailAddress,
        name: userData.fullName || userData.firstName,
        phone: userData.primaryPhoneNumber,
        avatar: userData.imageUrl,
      },
    });
  } else {
    return handleUserCreated(userData);
  }
};
