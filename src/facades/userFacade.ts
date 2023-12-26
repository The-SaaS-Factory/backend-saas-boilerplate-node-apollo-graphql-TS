import { PrismaClient, User } from "@prisma/client";
import { SettingType } from "../types/User";
import {
  checkMarketingActionsForNewUser,
  updateUserInEmailList,
} from "./marketingFacade.js";
import jwt from "jsonwebtoken";
import { env } from "process";
import clerkClient from "@clerk/clerk-sdk-node";
import { sendWelcomeEmail } from "./mailFacade.js";

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
    return await prisma.user.findFirst({
      where: {
        externalId: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
  } catch (error) {
    console.log(error);
    throw new Error("Error with credentials");
  }
};

export const handleUserCreated = async (userData) => {
  const user = await prisma.user.findFirst({
    where: {
      externalId: userData.id,
    },
  });

  if (!user) {
    const newUser = await prisma.user.create({
      data: {
        externalId: userData.id,
        externalAttributes: JSON.stringify(userData),
        username: userData.username,
        email: userData.email_addresses[0]?.email_address,
        name: userData.first_name,
      },
    });

    if (newUser.email) {
      sendWelcomeEmail(newUser);
    }

    checkMarketingActionsForNewUser("User", newUser.id);

    await createDefaultSettingForuser(newUser);
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
        externalAttributes: JSON.stringify(userData),
        username: userData.username,
        email: userData.email_addresses[0]?.email_address,
        name: userData.first_name,
      },
    });
  } else {
    return handleUserCreated(userData);
  }
};
