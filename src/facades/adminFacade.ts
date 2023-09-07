import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const generateKpi = async () => {
  await prisma.adminKpi.create({
    data: {
      name: "user_count_total",
      type: "counts",
      value: await prisma.user.count(),
    },
  });

  await prisma.adminKpi.create({
    data: {
      name: "memberships_revenue",
      type: "counts",
      value: await getTotalInvoiceAmount(),
    },
  });

  await prisma.adminKpi.create({
    data: {
      name: "memberships_actived_count_total",
      type: "counts",
      value: await prisma.membership.count(),
    },
  });

  return true;
};

async function getTotalInvoiceAmount() {
  const result = await prisma.invoice.aggregate({
    _sum: {
      amount: true,  
    },
  });

  return result._sum.amount ?? 0; 
}

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
