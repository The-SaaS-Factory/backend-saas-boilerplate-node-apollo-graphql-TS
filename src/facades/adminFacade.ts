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
      name: "organizations_count_total",
      type: "counts",
      value: await prisma.organization.count(),
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
    where: {
      status: "PAID",
    },
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
};

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

export const getAdminSettingValue = async (
  settingName: string,
  value: string
) => {
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

export const associateAclFacade = async ({
  modelPrimary,
  modelPrimaryId,
  modelToAssociate,
  modelToAssociateId,
}: {
  modelPrimary: string;
  modelPrimaryId: number;
  modelToAssociate: string;
  modelToAssociateId: number;
}) => {
  let model = null;

  switch (modelPrimary) {
    case "User":
      model = await prisma.user.findUnique({
        where: { id: modelPrimaryId },
      });
      break;
    case "Permission":
      model = await prisma.permission.findUnique({
        where: { id: modelPrimaryId },
      });
      break;
    case "Plan":
      model = await prisma.plan.findUnique({
        where: { id: modelPrimaryId },
      });
      break;
    case "Role":
      model = await prisma.role.findUnique({
        where: { id: modelPrimaryId },
      });
      break;
    default:
      return false;
  }

  if (!model) {
    return false;
  }

  // Realiza las operaciones necesarias para asociar los modelos
  if (modelPrimary === "User" && modelToAssociate === "Role") {
    await prisma.userRole.create({
      data: {
        userId: model.id,
        roleId: modelToAssociateId,
      },
    });
  } else if (modelPrimary === "User" && modelToAssociate === "Permission") {
    await prisma.userPermission.create({
      data: {
        userId: model.id,
        permissionId: modelToAssociateId,
      },
    });
  } else if (modelPrimary === "Permission" && modelToAssociate === "Role") {
    await prisma.rolePermission.create({
      data: {
        permissionId: model.id,
        roleId: modelToAssociateId,
      },
    });
  } else if (modelPrimary === "Plan" && modelToAssociate === "Permission") {
    await prisma.planPermission.create({
      data: {
        planId: model.id,
        permissionId: modelToAssociateId,
      },
    });
  } else if (modelPrimary === "Role" && modelToAssociate === "Permission") {
    await prisma.rolePermission.create({
      data: {
        roleId: model.id,
        permissionId: modelToAssociateId,
      },
    });
  }
};
