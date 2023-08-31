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

export async function migrateFrontendComponentsByDefault() {
  const components = [
    {
      name: "Hero",
      data: '{"title":"The SaaS Factory","resume":"Build your next SaaS business in a fast, scalable and fun way with our starter kit developed top technologies today","linkBtn1":"/start","linkBtn2":"/documentation","textBtn1":"Start building","textBtn2":"View Doc", "imageUrl": "https://tailwindui.com/img/component-images/project-app-screenshot.png"}',
      type: "DEFAULT",
    },
    {
      name: "Features",
      data: '{"title":"Your main Title","resume":" Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto quod tenetur accusamus molestiae doloribus facere aspernatur iste cupiditate laudantium recusandae incidunt numquam corrupti quos nam nulla inventore, consequatur doloremque illo?","featureslist":[{"Name":"Feature 1","Description":" Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto quod tenetur accusamus molestiae doloribus facere aspernatur iste cupiditate laudantium recusandae incidunt numquam corrupti quos nam nulla inventore, consequatur doloremque illo?"},{"Name":"Feature 2","Description":" Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto quod tenetur accusamus molestiae doloribus facere aspernatur iste cupiditate laudantium recusandae incidunt numquam corrupti quos nam nulla inventore, consequatur doloremque illo?"},{"Name":"Feature 3","Description":" Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto quod tenetur accusamus molestiae doloribus facere aspernatur iste cupiditate laudantium recusandae incidunt numquam corrupti quos nam nulla inventore, consequatur doloremque illo?"}]}',
      type: "DEFAULT",
    },
    {
      name: "About",
      data: '{"title":"The Business About Title","description":"Faucibus commodo massa rhoncus, volutpat. Dignissim sed eget risus enim. Mattis mauris semper sed amet vitae sed turpis id. Id dolor praesent donec est. Odio penatibus risus viverra tellus varius sit neque erat velit. Faucibus commodo massa rhoncus, volutpat. Dignissim sed eget risus enim. Mattis mauris semper sed amet vitae sed turpis id.<br><br>Et vitae blandit facilisi magna lacus commodo. Vitae sapien duis odio id et. Id blandit molestie auctor fermentum dignissim. Lacus diam tincidunt ac cursus in vel. Mauris varius vulputate et ultrices hac adipiscing egestas. Iaculis convallis ac tempor et ut. Ac lorem vel integer orci.<br><br>Et vitae blandit facilisi magna lacus commodo. Vitae sapien duis odio id et. Id blandit molestie auctor fermentum dignissim. Lacus diam tincidunt ac cursus in vel. Mauris varius vulputate et ultrices hac adipiscing egestas. Iaculis convallis ac tempor et ut. Ac lorem vel integer orci.","phrase":"Mauris varius vulputate et ultrices hac adipiscing egestas. Iaculis convallis ac tempor et ut. Ac lorem vel integer orci","phraseOwner":"Royler Marichal","photoBusiness":"https://images.unsplash.com/photo-1630569267625-157f8f9d1a7e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2669&q=80"}',
      type: "DEFAULT",
    },
    {
      name: "Privacy",
      data: '{"title":"Privacy of my business name","description":"Faucibus commodo massa rhoncus, volutpat. Dignissim sed eget risus enim. Mattis mauris semper sed amet vitae sed turpis id. Id dolor praesent donec est. Odio penatibus risus viverra tellus varius sit neque erat velit. Faucibus commodo massa rhoncus, volutpat. Dignissim sed eget risus enim. Mattis mauris semper sed amet vitae sed turpis id.<br><br>Et vitae blandit facilisi magna lacus commodo. Vitae sapien duis odio id et. Id blandit molestie auctor fermentum dignissim. Lacus diam tincidunt ac cursus in vel. Mauris varius vulputate et ultrices hac adipiscing egestas. Iaculis convallis ac tempor et ut. Ac lorem vel integer orci.<br><br>Et vitae blandit facilisi magna lacus commodo. Vitae sapien duis odio id et. Id blandit molestie auctor fermentum dignissim. Lacus diam tincidunt ac cursus in vel. Mauris varius vulputate et ultrices hac adipiscing egestas. Iaculis convallis ac tempor et ut. Ac lorem vel integer orci."}',
      type: "DEFAULT",
    },
    {
      name: "Pricing",
      data: '{"title":"The pricing main title ","resume":"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Sapiente consectetur cupiditate debitis incidunt sequi consequatur ipsam eveniet voluptate aliquid autem aspernatur, nesciunt sed molestiae saepe quibusdam qui expedita laboriosam! Ducimus."}',
      type: "DEFAULT",
    },
  ];

  const languages = await prisma.language.findMany();

  components.map(async (component) => {
    const payload = languages.map(async (lng: any) => {
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
