import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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
  await prisma.language.create({
    data: {
      name: "Spanish",
      lng: "es",
    },
  });
  await prisma.language.create({
    data: {
      name: "English",
      lng: "en",
    },
  });
  await prisma.language.create({
    data: {
      name: "Portuguese",
      lng: "pt",
    },
  });
  await prisma.adminCurrencies.create({
    data: {
      name: "USD",
      code: "USD",
      rate: 1,
    },
  });
}
 

export async function migrateDbSeedAdminUser() {
  const hashedPassword = await bcrypt.hash("123456789", 10);

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