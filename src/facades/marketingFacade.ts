import { PrismaClient, SuperAdminSetting } from "@prisma/client";
import { updateMembership } from "./membershipFacade.js";
import { calculateMonthsFromDays } from "./strFacade.js";
import { getSuperAdminSetting } from "./adminFacade.js";
const prisma = new PrismaClient();

export async function updateUserInEmailList(userId: number, listId: number) {
  //Fix this
}

export const checkMarketingActionsOnRegister = async (model, modelId) => {
  activateFreeTrial( model, modelId);
  sendWelcomeEmail(model, modelId);
};

const activateFreeTrial = async (model, modelId) => {
  const freeTrial: string = await getSuperAdminSetting("MARKETING_FREE_TRIAL");

  if (freeTrial == "true") {
    const planTrial = await getSuperAdminSetting("MARKETING_FREE_TRIAL_PLAN");
    const days = await getSuperAdminSetting("MARKETING_FREE_DAYS");

    if (planTrial) {
      const plan = await prisma.plan.findUnique({
        where: {
          id: parseInt(planTrial),
        },
      });

      if (plan) {
        const months = calculateMonthsFromDays(days ? parseInt(days) : 14);
        updateMembership({
          model,
          modelId,
          months,
          freeTrial: true,
          planId: plan.id,
        });
      } else {
        //send log
        //#Fix add module of logs/actions for super admin,
      }
    }
  }
};

export const sendWelcomeEmail = async (model, modelId) => {
  const welcomeEmail: string = await getSuperAdminSetting("MARKETING_WELCOME_EMAIL");
};
