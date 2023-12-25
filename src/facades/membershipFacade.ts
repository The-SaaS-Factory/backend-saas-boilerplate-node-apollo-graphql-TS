import { PrismaClient } from "@prisma/client";
import {
  handleUpdateDataForOrganization,
  handleUpdateDataForUser,
} from "./clerkFacade.js";
import { handleOrganizationUpdated } from "./organizationFacade.js";
const prisma = new PrismaClient();

export const updateMembership = async ({
  model,
  modelId,
  months,
  freeTrial,
  planId,
}: {
  model: string;
  modelId: number;
  months: number;
  freeTrial: boolean;
  planId: number;
}) => {
  let currentMemberShip = null;

  if (model === "User") {
    currentMemberShip = await prisma.membership.findFirst({
      where: {
        userId: modelId,
      },
    });

    propagateCapabilitiesFromPlanToUser(planId, modelId);
  } else if (model === "Organization") {
    currentMemberShip = await prisma.membership.findFirst({
      where: {
        organizationId: modelId,
      },
    });

    propagateCapabilitiesFromPlanToOrganization(planId, modelId);
  }

  const createPayload = {
    userId: model === "User" ? modelId : null,
    organizationId: model === "Organization" ? modelId : null,
    planId: planId,
    startDate: new Date(),
    endDate: new Date(),
  };

  const endDate = currentMemberShip
    ? new Date(currentMemberShip.endDate)
    : new Date();

  const days = months * 30.44;

  const membership = await prisma.membership.upsert({
    where: {
      id: currentMemberShip ? currentMemberShip.id : 0,
    },
    create: createPayload,
    update: {
      planId: planId,
      endDate: new Date(endDate.setMonth(endDate.getMonth() + months)),
    },
    include: {
      plan: true,
    },
  });

  //Update user in auth service
  if (model === "User") {
    handleUpdateDataForUser({
      scope: "publicMetadata",
      data: {
        membershipActive: true,
        membershipPlan: membership.plan.name,
        membershipStartDate: membership.startDate,
        membershipEndDate: membership.endDate,
      },
      userBdId: modelId,
    });
  } else if (model === "Organization") {
    handleUpdateDataForOrganization({
      scope: "publicMetadata",
      data: {
        membershipActive: true,
        membershipPlan: membership.plan.name,
        membershipStartDate: membership.startDate,
        membershipEndDate: membership.endDate,
      },
      organizationBdId: modelId,
    });
  }

  return membership;
};

export const propagateCapabilitiesOnAsociateWithPlanNewCapabilitie = async (
  planId
) => {
  const users = await prisma.membership.findMany({
    where: {
      planId: planId,
      userId: {
        not: null,
      },
    },
    distinct: ["userId"],
  });

  const organizations = await prisma.membership.findMany({
    where: {
      planId: planId,
      organizationId: {
        not: null,
      },
    },
    distinct: ["organizationId"],
  });

  organizations.map((organization) => {
    propagateCapabilitiesFromPlanToOrganization(
      planId,
      organization.organizationId
    );
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
      } else {
        await prisma.userCapabilities.update({
          where: {
            id: userCapabilicitie.id,
          },
          data: {
            count: c.capabilitie.type === "LIMIT" ? 0 : c.count,
          },
        });
      }
    })
  );
};

export const propagateCapabilitiesFromPlanToOrganization = async (
  planId: number,
  organizationId: number
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
      const organizationCapabilitie =
        await prisma.organizationCapabilities.findFirst({
          where: {
            organizationId: organizationId,
            capabilitieId: c.capabilitie.id,
          },
        });

      if (!organizationCapabilitie) {
        await prisma.organizationCapabilities.create({
          data: {
            organizationId: organizationId,
            capabilitieId: c.capabilitie.id,
            count: c.capabilitie.type === "LIMIT" ? 0 : c.count,
          },
        });
      } else {
        await prisma.organizationCapabilities.update({
          where: {
            id: organizationCapabilitie.id,
          },
          data: {
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
      currency: true,
    },
  });
};

export const getPlanByStripePlanId = async (priceId: string) => {
  return await prisma.plan.findFirst({
    where: {
      settings: {
        some: {
          settingName: "STRIPE_PLAN_ID",
          settingValue: priceId,
        },
      },
    },
  });
};
