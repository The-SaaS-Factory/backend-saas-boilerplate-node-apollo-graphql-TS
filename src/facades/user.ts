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

  if (setting.settingName === "newTournamentNotification") {
    const list = await prisma.marketingEmailLists.findFirst({
      where: {
        name: "newTournamentNotification",
      },
    });

    if (!list) {
      const listFinal = await prisma.marketingEmailLists.create({
        data: {
          name: "newTournamentNotification",
          type: "PLATFORM",
          userId: null,
        },
      });

      updateUserInEmailList(setting.userId, listFinal.id);
    } else {
      updateUserInEmailList(setting.userId, list.id);
    }
  }
  if (setting.settingName === "newMessagesNotification") {
    const list = await prisma.marketingEmailLists.findFirst({
      where: {
        name: "newMessagesNotification",
      },
    });

    if (!list) {
      const listFinal = await prisma.marketingEmailLists.create({
        data: {
          name: "newMessagesNotification",
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
  await prisma.userSetting.create({
    data: {
      userId: user.id,
      settingName: "tournamentAceptedChanllageByOtherUser",
      settingValue: "1",
    },
  });

  await prisma.userSetting.create({
    data: {
      userId: user.id,
      settingName: "profileMessagePrivates",
      settingValue: "1",
    },
  });

  const newMessagesNotification = await prisma.userSetting.create({
    data: {
      userId: user.id,
      settingName: "newMessagesNotification",
      settingValue: "1",
    },
  });

  checkSettingAction(newMessagesNotification);

  const newTournamentNotification = await prisma.userSetting.create({
    data: {
      userId: user.id,
      settingName: "newTournamentNotification",
      settingValue: "1",
    },
  });

  checkSettingAction(newTournamentNotification);

  const newPlatformNotification = await prisma.userSetting.create({
    data: {
      userId: user.id,
      settingName: "newPlatformNotification",
      settingValue: "1",
    },
  });

  checkSettingAction(newPlatformNotification);
}
