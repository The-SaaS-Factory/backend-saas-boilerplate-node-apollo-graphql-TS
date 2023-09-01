import { PrismaClient } from "@prisma/client";
import { updateMembership } from "./membershipFacade.js";

const prisma = new PrismaClient();
export const checkMarketingActionsForNewUser = async (user) => {
  //Check free trial config
  const freeTrial = await prisma.superAdminSetting.findFirst({
    where: {
      settingName: "MARKETING_FREE_TRIAL",
    },
  });

  if (freeTrial && freeTrial.settingValue == "true") {
    const planTrial = await prisma.superAdminSetting.findFirst({
      where: {
        settingName: "MARKETING_FREE_TRIAL_PLAN",
      },
    });
    const days = await prisma.superAdminSetting.findFirst({
      where: {
        settingName: "MARKETING_FREE_DAYS",
      },
    });

    if (planTrial) {
      const plan = await prisma.plan.findUnique({
        where: {
          id: parseInt(planTrial.settingValue),
        },
      });

      if (plan) {
        const months = calculateMonthsFromDays(
          days ? parseInt(days.settingValue) : 14
        );
        updateMembership(prisma, user.id, plan.id, months, true);
      } else {
        //send log
        //#Fix add module of logs/actions for super admin,
      }
    }
  }
};

function calculateMonthsFromDays(days: number) {
  const averageDaysPerMonth = 30.44;

  const months = days / averageDaysPerMonth;
 
  return months;
}
