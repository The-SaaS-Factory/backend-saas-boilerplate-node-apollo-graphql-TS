import { PrismaClient, User } from "@prisma/client";
import { SettingType } from "../types/User";
import {
  checkMarketingActionsOnRegister,
  sendWelcomeEmail,
} from "./marketingFacade.js";
import jwt from "jsonwebtoken";
import clerkClient from "@clerk/clerk-sdk-node";
import { syncOrganizationsWithClerk } from "./organizationFacade.js";

const prisma = new PrismaClient();

export async function checkSettingAction(setting: SettingType) {
  //Fix this
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
        return await handleUserCreated(userClerk, "request");
      }
    } else {
      return user;
    }
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
};

export const handleUserCreated = async (userData, source = "webhook") => {
  let newUser = null;

   const  user = await prisma.user.findFirst({
    where: {
      externalId: userData.id,
    },
  });

  if (!user) {
    //Is possible that user can not be created by clerk, so we need to create it
    if (source === "request") {
      newUser = await prisma.user.create({
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
      newUser = await prisma.user.create({
        data: {
          externalId: userData.id,
          externalAttributes: JSON.stringify(userData),
          username: userData.username,
          email: userData.email_addresses[0]?.email_address,
          name: userData.fullName || userData.first_name,
          avatar: userData.profile_image_url,
        },
      });
    }

    checkMarketingActionsOnRegister("User", newUser.id);

    createDefaultSettingForuser(newUser);

    //Check if user has organization in clerk and create it
    syncOrganizationsWithClerk(newUser);

    return newUser;
  } else {
    return handleUserUpdated(userData, "request");
  }
};

export const handleUserUpdated = async (userData, source = "webhook") => {
  const user = await prisma.user.findFirst({
    where: {
      externalId: userData.id,
    },
  });

  if (user) {
    let dataUpdated = {};
    if (source === "request") {
      dataUpdated = {
        externalId: userData.id,
        externalAttributes: JSON.stringify(userData),
        username: userData.username,
        email: userData.emailAddresses[0]?.emailAddress,
        name: userData.fullName || userData.firstName,
        phone: userData.primaryPhoneNumber,
        avatar: userData.imageUrl,
      };
    } else {
      dataUpdated = {
        externalId: userData.id,
        externalAttributes: JSON.stringify(userData),
        username: userData.username,
        email: userData.email_addresses[0]?.email_address,
        name: userData.fullName || userData.first_name,
        avatar: userData.profile_image_url,
      };
    }

    return await prisma.user.update({
      where: {
        id: user.id,
      },
      data: dataUpdated,
    });
  } else {
    return handleUserCreated(userData);
  }
};
