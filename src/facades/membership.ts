import { PrismaClient } from "@prisma/client";

export const updateMembership = async (
  client: PrismaClient,
  userId: number,
  planId: number,
  months: number
) => {
  const currentMemberShip = await client.membership.findFirst({
    where: {
      userId: userId,
    },
  });

  const endDate = currentMemberShip
    ? new Date(currentMemberShip.endDate)
    : new Date();
  //I update, get current endDate and increment monts
  return await client.membership.upsert({
    where: {
      userId: userId,
    },
    create: {
      userId: userId,
      planId: planId,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + months)),
    },
    update: {
      planId: planId,
      endDate: new Date(endDate.setMonth(endDate.getMonth() + months)),
    },
  });
};
