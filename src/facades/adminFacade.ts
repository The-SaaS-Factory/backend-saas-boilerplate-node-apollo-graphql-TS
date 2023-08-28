import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const generateKpi = async () => {
  //user_count_total
  await prisma.adminKpi.create({
    data: {
      name: "user_count_total",
      type: "counts",
      value: await prisma.user.count(),
    },
  });

  //user_count_total
  await prisma.adminKpi.create({
    data: {
      name: "post_count_total",
      type: "counts",
      value: await prisma.publication.count(),
    },
  });

  //memberships_actived_count_total
  await prisma.adminKpi.create({
    data: {
      name: "memberships_actived_count_total",
      type: "counts",
      value: await prisma.membership.count(),
    },
  });

  return true;
};

export const getSuperAdminSetting = async (settingName: string) => {
  const setting = await prisma.superAdminSetting.findFirst({
    where: {
      settingName: settingName,
    },
  });

  return setting ? setting.settingValue : null;
};

export const getAdminSetting = async (settingName: string) => {
  const setting = await prisma.userSetting.findFirst({
    where: {
      settingName: settingName,
    },
  });

  return setting ? setting.settingValue : null;
};
