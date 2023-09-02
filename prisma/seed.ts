import { PrismaClient } from "@prisma/client";
import { rols } from "./seeds/rols.js";
import { languages } from "./seeds/languages.js";
import { currencies } from "./seeds/currencies.js";
import { users } from "./seeds/users.js";
import { frontendComponents } from "./seeds/frontendComponents.js";
import { capabilities, planCapabilities, plans } from "./seeds/plans.js";
import { settings } from "./seeds/platform.js";
const prisma = new PrismaClient();

async function main() {
  prisma.$transaction(async (tx) => {
    await tx.role.createMany({
      data: rols,
    });

    await tx.adminCurrencies.createMany({
      data: currencies,
    });
    await tx.user.createMany({
      data: users,
    });
    await tx.language.createMany({
      data: languages,
    });
    await tx.userRole.create({
      data: {
        userId: 1,
        roleId: 1,
      },
    });

    await tx.frontendComponent.createMany({
      data: frontendComponents,
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
