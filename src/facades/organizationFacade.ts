import { PrismaClient } from "@prisma/client";
import { checkMarketingActionsOnRegister } from "./marketingFacade.js";
import clerkClient from "@clerk/clerk-sdk-node";

const prisma = new PrismaClient();

export const handleCreateOrganization = async (organizationData) => {
  let userAdmin = null;

  userAdmin = await prisma.user.findFirst({
    where: {
      externalId: organizationData.created_by,
    },
  });

  if (userAdmin) {
    const organization = await prisma.organization.create({
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

    checkMarketingActionsOnRegister("Organization", organization.id);
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

export const getClerkOrganizations = async (userId) => {
  const organizations = clerkClient.users.getOrganizationMembershipList({
    userId,
  });

  return organizations;
};

export const syncOrganizationsWithClerk = async (user) => {
  const clerkOrganizations = await getClerkOrganizations(user.externalId);
  if (clerkOrganizations) {
    for (const clerkOrganization of clerkOrganizations) {
      const organization = await prisma.organization.findFirst({
        where: {
          externalId: clerkOrganization.organization.id,
        },
      });

      if (!organization) {
        await handleCreateOrganization(clerkOrganization.organization);
      } else {
        await handleOrganizationUpdated(clerkOrganization.organization);
      }
    }
  }
};
