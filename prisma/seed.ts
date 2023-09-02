import { PrismaClient } from "@prisma/client";
import { rols } from "./seeds/rols.js";
import bcrypt from "bcrypt";
import { languages } from "./seeds/languages.js";
import { currencies } from "./seeds/currencies.js";
import { users } from "./seeds/users.js";
import { frontendComponents } from "./seeds/frontendComponents.js";
const prisma = new PrismaClient();

async function main() {
  prisma.$transaction(async (tx) => {
    await prisma.role.createMany({
      data: rols,
    });

    prisma.adminCurrencies.createMany({
      data: currencies,
    });
    prisma.user.createMany({
      data: users,
    });
    await prisma.language.createMany({
      data: languages,
    });
    prisma.userRole.create({
      data: {
        userId: 1,
        roleId: 1,
      },
    });

    const lngs = await prisma.language.findMany();

    frontendComponents.map(async (component) => {
      const payload = lngs.map(async (lng: any) => {
        const payload = {
          name: component.name,
          data: component.data,
          type: component.type,
          languageId: lng.id,
        };
        await prisma.frontendComponent.createMany({
          data: payload,
        });
      });
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
