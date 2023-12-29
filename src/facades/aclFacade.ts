import { PrismaClient } from "@prisma/client";
import { GraphQLError } from "graphql";
const prisma = new PrismaClient();
export const checkPermission = (
  userPermissions: string[],
  permissionName: string
) => {
  !userPermissions.includes(permissionName) && returnUnauthorized();
};

export const hasPermission = async (
  userPermissions: string[],
  permissionName: string
) => {
  return userPermissions.includes(permissionName);
};

export const returnUnauthorized = () => {
  throw new GraphQLError("You don't have permission to perform this action");
};

export const syncUserPermissions = async (
  permissions: string[],
  userId: number
) => {
  await prisma.userPermission.deleteMany({
    where: {
      userId,
    },
  });

  const permissionsInDb = await prisma.permission.findMany({
    where: {
      name: {
        in: permissions,
      },
    },
  });

  await prisma.userPermission.createMany({
    data: permissionsInDb.map((permission) => ({
      userId,
      permissionId: permission.id,
    })),
  });


};
