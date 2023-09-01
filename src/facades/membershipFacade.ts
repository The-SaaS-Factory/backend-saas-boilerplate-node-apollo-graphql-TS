import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const updateMembership = async (
  client: PrismaClient,
  userId: number,
  planId: number,
  months: number,
  freeTrial: boolean
) => {
  const currentMemberShip = await client.membership.findFirst({
    where: {
      userId: userId,
    },
  });

  const endDate = currentMemberShip
    ? new Date(currentMemberShip.endDate)
    : new Date();

  const days = months * 30.44;

  propagateCapabilitiesFromPlanToUser(planId, userId);

  return await client.membership.upsert({
    where: {
      userId: userId,
    },
    create: {
      userId: userId,
      planId: planId,
      startDate: new Date(),
      endDate: new Date(new Date().getTime() + days * 24 * 60 * 60 * 1000),
      endDateFreeTrial: freeTrial
        ? new Date(new Date().setMonth(new Date().getMonth() + months))
        : null,
    },
    update: {
      planId: planId,
      endDate: new Date(endDate.setMonth(endDate.getMonth() + months)),
    },
  });
};

export const propagateCapabilitiesOnAsociateWithPlanNewCapabilitie = async (
  planId
) => {
  const users = await prisma.membership.findMany({
    where: {
      planId: planId,
    },
    distinct: ["userId"],
  });

  users.map((user) => {
    propagateCapabilitiesFromPlanToUser(planId, user.userId);
  });
};

export const propagateCapabilitiesFromPlanToUser = async (
  planId: number,
  userId: number
) => {
  const capabilities = await prisma.planCapabilities.findMany({
    where: {
      planId: planId,
    },
    include: {
      capabilitie: true,
    },
  });

  Promise.all(
    capabilities.map(async (c) => {
      const userCapabilicitie = await prisma.userCapabilities.findFirst({
        where: {
          userId: userId,
          capabilitieId: c.capabilitie.id,
        },
      });

      if (!userCapabilicitie) {
        await prisma.userCapabilities.create({
          data: {
            userId: userId,
            capabilitieId: c.capabilitie.id,
            count: c.capabilitie.type === "LIMIT" ? 0 : c.count,
          },
        });
      }
    })
  );
};

export const getInvoiceByModelAndModelId = async (model, modelId) => {
  return await prisma.invoice.findFirst({
    where: {
      model: model,
      modelId: modelId,
    },
    include: {
      currency: true
    }
  });
};
