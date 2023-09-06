import { PrismaClient, User } from "@prisma/client";
import { sendMail } from "./mailFacade.js";
import Handlebars from "handlebars";

import fs from "fs";
import pubsub from "./pubSubFacade.js";

const prisma = new PrismaClient();

export const sendNewMessageNotification = async (user: any): Promise<void> => {
  //Example function, not active jet, you can use, bonus!
  const templateHtml = fs.readFileSync(
    "./src/templates/emails/client/newMessageNotification.hbs",
    "utf-8"
  );

  let content = "Test 1";
  const contentEN = "Test 1";
  const contentES = "Prueba 1";
  const contentPT = "Proba 1";
  let title = "Welcome";
  const titleEn = "New private message ";
  const titleEs = "Nuevo mensaje ";
  const titlePt = "Nova mensagem ";

  if (user.languageId == 1) {
    content = contentEN;
    title = titleEn;
  }
  if (user.languageId == 2) {
    content = contentES;
    title = titlePt;
  }
  if (user.languageId == 3) {
    content = contentPT;
    title = titlePt;
  }
  const template = Handlebars.compile(templateHtml);

  const html = template({ username: user.name, content: content });

  sendMail(user.email, html, title);
};

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
