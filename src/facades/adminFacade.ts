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

export const getCurrencyIdByCode = async (code: string) => {
  const currency = await prisma.adminCurrencies.findFirst({
    where: {
      code: code,
    },
  });

  return currency ? currency.id : null;
}

export const getSuperAdminSetting = async (settingName: string) => {
  try {
    const setting = await prisma.superAdminSetting.findFirst({
      where: {
        settingName: settingName,
      },
    });

    return setting ? setting.settingValue : null;
  } catch (error) {
    throw error;
  }
};

export const getAdminSettingValue = async (settingName: string, value: string) => {
  try {
    const setting = await prisma.userSetting.findFirst({
      where: {
        settingName: settingName,
        settingValue: value,
      },
    });

    return setting ? setting : null;
  } catch (error) {
    throw error;
  }
};
