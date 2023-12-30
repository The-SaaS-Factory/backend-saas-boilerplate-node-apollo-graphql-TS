import { PrismaClient } from "@prisma/client";
import { languages } from "./seeds/languages.js";
import { capabilities, planCapabilities, plans } from "./seeds/plans.js";
import { settings } from "./seeds/platform.js";
import { currencies } from "./seeds/currenciess.js";
import { permissions } from "./seeds/permissions.js";
import { modules } from "./seeds/modules.js";
const prisma = new PrismaClient();

async function main() {
  prisma.$transaction(async (tx) => {
    await tx.permission.createMany({
      data: permissions,
    });
    await tx.module.createMany({
      data: modules,
    });

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

 