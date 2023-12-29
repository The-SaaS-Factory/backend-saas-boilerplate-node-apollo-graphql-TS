import clerkClient, { WebhookEvent } from "@clerk/clerk-sdk-node";
import { Webhook } from "svix";
import { Response } from "express";
import { handleUserCreated, handleUserUpdated } from "./userFacade.js";
import { PrismaClient } from "@prisma/client";
import {
  handleCreateOrganization,
  handleOrganizationUpdated,
} from "./organizationFacade.js";
const prisma = new PrismaClient();

export const handleWebhook = async (req, res) => {
  // Check if the 'Signing Secret' from the Clerk Dashboard was correctly provided
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    throw new Error("You need a WEBHOOK_SECRET in your .env");
  }

  // Grab the headers and body
  const headers = req.headers;
  const payload = req.body;

  // Get the Svix headers for verification
  const svix_id = headers["svix-id"] as string;
  const svix_timestamp = headers["svix-timestamp"] as string;
  const svix_signature = headers["svix-signature"] as string;

  // If there are missing Svix headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).send("Error occurred -- no svix headers");
  }

  // Initiate Svix
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Attempt to verify the incoming webhook
  // If successful, the payload will be available from 'evt'
  // If the verification fails, error out and  return error code
  try {
    evt = wh.verify(JSON.stringify(payload), {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err: any) {
    // Console log and return errro
    console.log("Webhook failed to verify. Error:", err.message);
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  handleEventWebhook(evt);

  return res.status(200).json({
    success: true,
    message: "Webhook received",
  });
};

const handleEventWebhook = async (evt: WebhookEvent) => {
  switch (evt.type) {
    case "user.created":
      await handleUserCreated(evt.data,'webhook');
      break;
    case "user.updated":
      await handleUserUpdated(evt.data, "webhook");
      break;
    case "organization.created":
      await handleCreateOrganization(evt.data);
      break;
    case "organization.updated":
      await handleOrganizationUpdated(evt.data);
      break;
  }
};

const getUserClerkId = async (userId: number) => {
  return await prisma.user.findFirst({
    where: {
      id: userId,
    },
    select: {
      externalId: true,
    },
  });
};

const getOrganizationClerkById = async (organizationId: number) => {
  return await prisma.organization.findFirst({
    where: {
      id: organizationId,
    },
    select: {
      externalId: true,
    },
  });
};

export const getOrganizationMembers = async (organizationId: string) => {
  return await clerkClient.organizations.getOrganizationMembershipList({
    organizationId,
  });
};

export const handleUpdateDataForUser = async ({
  scope,
  userBdId,
  data,
}: {
  scope: string;
  userBdId: number;
  data: any;
}) => {
  const userId = (await getUserClerkId(userBdId)).externalId;

  if (!userId) throw new Error("User not found");

  if (scope === "publicMetadata") {
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: data,
    });
  }

  if (scope === "privateMetadata") {
    await clerkClient.users.updateUserMetadata(userId, {
      privateMetadata: data,
    });
  }

  if (scope === "unsafeMetadata") {
    await clerkClient.users.updateUserMetadata(userId, {
      unsafeMetadata: data,
    });
  }
};

export const handleUpdateDataForOrganization = async ({
  scope,
  organizationBdId,
  data,
}: {
  scope: string;
  organizationBdId: number;
  data: any;
}) => {
  const organizationId = (await getOrganizationClerkById(organizationBdId))
    .externalId;

  if (!organizationId) throw new Error("User not found");

  if (scope === "publicMetadata") {
    await clerkClient.organizations.updateOrganizationMetadata(organizationId, {
      publicMetadata: data,
    });
  }

  if (scope === "privateMetadata") {
    await clerkClient.organizations.updateOrganizationMetadata(organizationId, {
      privateMetadata: data,
    });
  }
 
};

export const getUserOrganizations = async (userId: number) => {
  const userClerkId = await getUserClerkId(userId);

  if (!userClerkId) throw new Error("User clerk not found");

  const organizations = await clerkClient.users.getOrganizationMembershipList(
    {
      userId: userClerkId.externalId,
    }
  );

  console.log(organizations);
  

 // return await clerkClient.users.getUser(user.externalId);
};