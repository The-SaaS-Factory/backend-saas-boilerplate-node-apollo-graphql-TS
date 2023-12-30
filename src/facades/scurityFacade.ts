import { PrismaClient } from "@prisma/client";
import { GraphQLError } from "graphql";
const prisma = new PrismaClient();
export const checkPermission = (
  userPermissions: string[],
  permissionName: string
) => {
  console.log(userPermissions);

  !userPermissions.includes(permissionName) &&
    !userPermissions.includes("superAdmin:totalAccess") &&
    returnUnauthorized();
};

export const hasPermission = async (
  userPermissions: string[],
  permissionName: string
) => {
  return (
    userPermissions.includes(permissionName) ||
    userPermissions.includes("superAdmin:totalAccess")
  );
};

export const returnUnauthorized = () => {
  throw new GraphQLError("You don't have permission to perform this action");
};

export const syncUserPermissions = async (
  userId: number,
  permissionsNames: string[],
  client: PrismaClient = prisma
) => {
  const permissions = await prisma.permission.findMany({
    where: {
      name: {
        in: permissionsNames,
      },
    },
  });

  const oldPermissions = await client.permission.findMany({
    where: {
      UserPermission: {
        some: {
          id: userId,
        },
      },
    },
  });

  await client.user.update({
    where: {
      id: userId,
    },
    data: {
      Permission: {
        connect: permissions.map((permission) => ({ id: permission.id })),
        disconnect: oldPermissions,
      },
    },
  });
};

export const syncOrganizationPermissions = async (
  organizationId: number,
  permissionsNames: string[],
  client: PrismaClient = prisma
) => {
  console.log(permissionsNames);

  if (!permissionsNames || permissionsNames.length === 0) return;

  const permissions = await prisma.permission.findMany({
    where: {
      name: {
        in: permissionsNames,
      },
      Organization: {
        none: {
          id: organizationId,
        },
      },
    },
  });

  if (permissions.length === 0) return;
  await client.organization.update({
    where: {
      id: organizationId,
    },
    data: {
      Permission: {
        connect: permissions,
      },
    },
  });
};
