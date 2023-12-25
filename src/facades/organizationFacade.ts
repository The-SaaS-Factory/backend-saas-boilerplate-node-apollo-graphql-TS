import { PrismaClient } from "@prisma/client";
 

const prisma = new PrismaClient();

export const handleCreateOrganization = async (organizationData) => {
  console.log(organizationData);
  let userAdmin = null;

  userAdmin = await prisma.user.findFirst({
    where: {
      externalId: organizationData.created_by,
    },
  });

  if (userAdmin) {
    await prisma.organization.create({
      data: {
        externalId: organizationData.id,
        externalAttributes: JSON.stringify(organizationData),
        name: organizationData.name,
        user: {
          connect: {
            id: parseInt(userAdmin.id),
          },
        },
      },
    });
  }
};

export const handleOrganizationUpdated = async (organizationData) => {
  const organization = await prisma.organization.findFirst({
    where: {
      externalId: organizationData.id,
    },
  });

  if (organization) {
    return await prisma.organization.update({
      where: {
        id: organization.id,
      },
      data: {
        externalAttributes: JSON.stringify(organizationData),
        name: organizationData.name,
      },
    });
  } else {
    return handleCreateOrganization(organizationData);
  }
};


 