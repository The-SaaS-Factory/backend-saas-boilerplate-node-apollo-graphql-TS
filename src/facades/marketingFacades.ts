import { PrismaClient } from "@prisma/client";
import { updateMembership } from "./membership.js";

const prisma = new PrismaClient();
export const checkMarketingActionsForNewUser = async (user) => {
  //Check free trial config
  const freeTrial = await prisma.superAdminSetting.findFirst({
    where: {
      settingName: "MARKETING_FREE_TRIAL",
    },
  });

  if (freeTrial && freeTrial.settingValue == "true") {
    const plan = await prisma.superAdminSetting.findFirst({
      where: {
        settingName: "MARKETING_FREE_TRIAL_PLAN",
      },
    });
    const days = await prisma.superAdminSetting.findFirst({
      where: {
        settingName: "MARKETING_FREE_DAYS",
      },
    });

    if (plan) {
      const months = calculateMonthsFromDays(
        days ? parseInt(days.settingValue) : 14
      );
      updateMembership(prisma, user.id, plan.id, months, true);
    }
  }
};

function calculateMonthsFromDays(days: number) {
  const averageDaysPerMonth = 30.44; // Average days in a month

  const months = Math.floor(days / averageDaysPerMonth); // Number of complete months
  const remainingDays = days % averageDaysPerMonth; // Remaining days beyond complete months

  return months;
}
