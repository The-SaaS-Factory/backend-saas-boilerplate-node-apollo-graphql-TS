import { PrismaClient } from "@prisma/client";

import bcrypt from "bcryptjs";

function convertToSlug(text) {
  return text
    .toLowerCase() // Convertir a minúsculas
    .replace(/[\s\-]+/g, "-") // Reemplazar espacios y guiones con un único guion
    .replace(/[^\w\-]+/g, "") // Remover caracteres especiales
    .replace(/\-\-+/g, "-") // Remover múltiples guiones consecutivos
    .replace(/^-+|-+$/g, ""); // Remover guiones al principio y al final
}
const prisma = new PrismaClient();

const permissions = [
  {
    name: "admin_user_crud",
    description: "",
  },
  {
    name: "user_profile_update_cover",
    description: "",
  },
  {
    name: "user_profile_update_website",
    description: "",
  },
  {
    name: "send_private_messages",
    description: "",
  },
  {
    name: "verified_account",
    description: "",
  },
  {
    name: "publish_post_1",
    description: "",
  },
  {
    name: "publish_post_2",
    description: "",
  },
  {
    name: "publish_post_3",
    description: "",
  },
  {
    name: "publish_post_4",
    description: "",
  },
  {
    name: "publish_post_5",
    description: "",
  },
  {
    name: "publish_post_6",
    description: "",
  },
  {
    name: "publish_post_7",
    description: "",
  },
  {
    name: "publish_post_8",
    description: "",
  },
  {
    name: "publish_post_9",
    description: "",
  },
  {
    name: "publish_post_10",
    description: "",
  },
];

const rols = [
  {
    name: "superadmin",
    description: "",
    permissions: ["admin_user_crud", "user_profile_update_cover"],
  },
  {
    name: "marketing",
    description: "",
    permissions: ["admin_user_crud", "user_profile_update_cover"],
  },
  {
    name: "economy",
    description: "",
    permissions: ["admin_user_crud", "user_profile_update_cover"],
  },
  {
    name: "support",
    description: "",
    permissions: ["admin_user_crud"],
  },
];

 

export async function migrateDbSeedLanguageAndCurrency() {
  const Spanish = await prisma.language.create({
    data: {
      name: "Spanish",
      lng: "es",
    },
  });
  const English = await prisma.language.create({
    data: {
      name: "English",
      lng: "en",
    },
  });
  const Portuguese = await prisma.language.create({
    data: {
      name: "Portuguese",
      lng: "pt",
    },
  });
  const Currencies = await prisma.adminCurrencies.create({
    data: {
      name: "Credit",
      code: "Credit",
      rate: 1,
    },
  });
}

export async function migrateDbSeedAclPermissions() {
  Promise.all(
    permissions.map(async (permission: any) => {
      await prisma.permission.create({
        data: {
          name: permission.name,
          description: permission.description,
        },
      });
    })
  )
    .then(async (data) => {})
    .catch((error) => console.log(error));
}

 
export async function migrateDbSeedAclAsocciatePermissionsToRole() {
  for (const role of rols) {
    const dbRole = await prisma.role.create({
      data: {
        name: role.name,
        description: role.description,
      },
    });

    const dbPermissions = await prisma.permission.findMany({
      where: {
        name: {
          in: role.permissions,
        },
      },
    });

    const rolePermissionData = dbPermissions.map((permissionN) => ({
      roleId: dbRole.id,
      permissionId: permissionN.id,
    }));

    await prisma.rolePermission.createMany({
      data: rolePermissionData,
    });
  }
}

export async function migrateDbSeedAdminUser() {
  const hashedPassword = await bcrypt.hash("123456789", 10);

  const adminRole = await prisma.role.findFirst({
    where: { name: "admin" },
  });

  await prisma.user.create({
    data: {
      username: "admin",
      name: "admin",
      email: "admin@admin.com",
      password: hashedPassword,
    },
  });

  await prisma.userRole.create({
    data: {
      userId: 1,
      roleId: 1,
    },
  });
}

export async function migrateUserTypes() {
  await prisma.userType.create({
    data: {
      name: "PERSON",
      status: "ACTIVE",
    },
  });

  await prisma.userType.create({
    data: {
      name: "MINISTRY",
      status: "ACTIVE",
    },
  });
  await prisma.userType.create({
    data: {
      name: "CHURCH",
      status: "ACTIVE",
    },
  });
  await prisma.userType.create({
    data: {
      name: "BUSINESS",
      status: "ACTIVE",
    },
  });
  await prisma.userType.create({
    data: {
      name: "ARTIST",
      status: "ACTIVE",
    },
  });
 
}
