import { PrismaClient, SuperAdminSetting } from "@prisma/client";
import { updateMembership } from "./membershipFacade.js";
import { calculateMonthsFromDays } from "./strFacade.js";
import { getSuperAdminSetting } from "./adminFacade.js";
import {
  sendLoopsTransactionalEventToUser,
  storeContactInLoopsAudience,
} from "./loopsEmailMarketingFacade.js";
const prisma = new PrismaClient();

export async function updateUserInEmailList(userId: number, listId: number) {
  //Fix this
}

export const checkMarketingActionsOnRegister = async (model, modelId) => {
  activateFreeTrial(model, modelId);
  sendWelcomeEmail(model, modelId);
  storeContactInEmailProvider(model, modelId);
};

const storeContactInEmailProvider = async (model, modelId) => {
  const storeContactEnabled: string = await getSuperAdminSetting(
    "LOOPS_STORE_CONTACTS_ENABLED"
  );

  if (model === "User" && storeContactEnabled === "true") {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(modelId) },
    });

    if (user) {
      storeContactInLoopsAudience(user.email, user.name, "userRegistered");
    }
  } else if (model === "Organization" && storeContactEnabled === "true") {
    const organization = await prisma.organization.findUnique({
      where: { id: parseInt(modelId) },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (organization) {
      storeContactInLoopsAudience(
        organization.user.email,
        organization.name,
        "organizationRegistered"
      );
    }
  }
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
  const loopActived: string = await getSuperAdminSetting("LOOPS_ENABLED");

  if (loopActived == "true") {
    const loopId: string = await getSuperAdminSetting("LOOPS_API_KEY");

    if (loopId) {
      if (model === "User") {
        const user = await prisma.user.findUnique({
          where: { id: parseInt(modelId) },
        });
        //Check email for user
        const welcomeEmailForUserEnabled = await getSuperAdminSetting(
          "MARKETING_WELCOME_EMAIL_FOR_USERS_ENABLED"
        );

        const welcomeEmailForUser = await getSuperAdminSetting(
          "MARKETING_WELCOME_EMAIL_USER_TRANSACTIONALID"
        );

        if (
          welcomeEmailForUserEnabled === "true" &&
          user &&
          welcomeEmailForUser
        ) {
          const payload = {
            email: user.email,
            transactionalId: welcomeEmailForUser,
            dataVariables: {
              name: user.name,
            },
          };

          sendLoopsTransactionalEventToUser(payload);
        }
      }
      if (model === "Organization") {
        const organization = await prisma.organization.findUnique({
          where: { id: parseInt(modelId) },
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        });
        //Check email for organization
        const welcomeEmailForOrganizationEnabled = await getSuperAdminSetting(
          "MARKETING_WELCOME_EMAIL_FOR_ORGANIZATIONS_ENABLED"
        );

        const welcomeEmailForOrganization = await getSuperAdminSetting(
          "MARKETING_WELCOME_EMAIL_ORGANIZATION_TRANSACTIONALID"
        );

        if (
          welcomeEmailForOrganizationEnabled === "true" &&
          organization &&
          welcomeEmailForOrganization
        ) {
          const payload = {
            email: organization.user.email,
            transactionalId: welcomeEmailForOrganization,
            dataVariables: {
              name: organization.name,
            },
          };
          sendLoopsTransactionalEventToUser(payload);
        }
      }
    }
  }
};
