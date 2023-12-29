import { PrismaClient } from "@prisma/client";
import { rols } from "./seeds/rols.js";
import { languages } from "./seeds/languages.js";
import { capabilities, planCapabilities, plans } from "./seeds/plans.js";
import { settings } from "./seeds/platform.js";
import { currencies } from "./seeds/currenciess.js";
import { permissions } from "./seeds/permissions.js";
const prisma = new PrismaClient();

async function main() {
  prisma.$transaction(async (tx) => {
    await tx.permission.createMany({
      data: permissions,
    });
    await tx.role.createMany({
      data: rols,
    });

    const firstRole = await tx.role.findFirst();
    if (firstRole) await connectPermissionsWithRols(tx, firstRole.id as number);

    await tx.adminCurrencies.createMany({
      data: currencies,
    });
    await tx.language.createMany({
      data: languages,
    });

    await tx.capabilitie.createMany({
      data: capabilities,
    });
    await tx.plan.createMany({
      data: plans,
    });
    await tx.planCapabilities.createMany({
      data: planCapabilities,
    });
    await tx.superAdminSetting.createMany({
      data: settings,
    });
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export const connectPermissionsWithRols = async (tx: any, roleId: number) => {
  const permissions = await tx.permission.findMany();

  for (const permission of permissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: roleId,
        permissionId: permission.id,
      },
    });
  }
};
