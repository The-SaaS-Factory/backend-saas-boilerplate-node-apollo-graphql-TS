import { PrismaClient, User } from "@prisma/client";
import { SettingType } from "../types/User";
import { updateUserInEmailList } from "./marketing.js";

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
