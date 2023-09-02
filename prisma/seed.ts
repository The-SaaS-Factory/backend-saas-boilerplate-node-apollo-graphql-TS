import { PrismaClient } from "@prisma/client";
import { rols } from "./seeds/rols.js";
import { languages } from "./seeds/languages.js";
import { currencies } from "./seeds/currencies.js";
import { users } from "./seeds/users.js";
import { frontendComponents } from "./seeds/frontendComponents.js";
const prisma = new PrismaClient();

async function main() {
  prisma.$transaction(async (tx) => {
    await tx.role.createMany({
      data: rols,
    });

    tx.adminCurrencies.createMany({
      data: currencies,
    });
    
    await tx.language.createMany({
      data: languages,
    });
  

    await tx.frontendComponent.createMany({
      data: frontendComponents,
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
