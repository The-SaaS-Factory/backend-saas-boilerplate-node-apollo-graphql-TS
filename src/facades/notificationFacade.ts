import { PrismaClient } from "@prisma/client";

import pubsub from "./pubSubFacade.js";

const prisma = new PrismaClient();

export const sendInternalNotificatoin = async (
  userId: number,
  content: string,
  image?: string
): Promise<void> => {
  try {
    const payload = {
      userId: userId,
      image: image,
      content: content,
    };

    await prisma.notification.create({
      data: {
        userId: payload.userId,
        image: payload.image ?? "",
        type: "ALERT",
        content: payload.content,
      },
    });

    const notificationsNotReaded = await prisma.notification.count({
      where: {
        userId: userId,
        viewed: false,
      },
    });

    let payloadSubscription = {
      userId: payload.userId,
      content: payload.content,
      notificationsCount: notificationsNotReaded,
    };

    pubsub.publish("NEW_INTERNAL_NOTIFICATION", payloadSubscription);
  } catch (error) {
    throw new Error(error);
  }
};

export const notifyAdmin = async (type: string, content: string) => {
  const admins = await prisma.user.findMany({
    where: {
      UserRole: {
        some: {
          roleId: 1,
        },
      },
    },
  });

  if (type === "INTERNAL") {
    admins.map((admin) => {
      sendInternalNotificatoin(admin.id, content);
    });
  }
};
