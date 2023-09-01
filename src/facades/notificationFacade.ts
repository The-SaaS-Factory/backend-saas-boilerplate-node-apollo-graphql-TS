import { PrismaClient, User } from "@prisma/client";
import { sendMail } from "./mailFacade.js";
import Handlebars from "handlebars";
 
import fs from "fs";

const prisma = new PrismaClient();

export async function notify(userId: number, type: string) {
  const user = await prisma.user.findFirst({ where: { id: userId } });

  if (user && type === "newMessage") {
    const settingEnabled = await prisma.userSetting.findFirst({
      where: {
        userId: user.id,
        settingName: "newMessagesNotification",
      },
    });

    if (settingEnabled && settingEnabled.settingValue === "1") {
      sendNewMessageNotificationAction(user);
    }
  }
}

export async function sendNewMessageNotificationAction(user: User) {
  //Check last notification send
  const noteChatNotificationTime = await prisma.userNotes.findFirst({
    where: {
      userId: user.id,
      noteName: "lastTimeNotificationMessageDelivered",
    },
  });

  if (noteChatNotificationTime) {
    const time = new Date(noteChatNotificationTime.noteValue);
    const currentTime = new Date();

    const timeDiffInMinutes = Math.floor(
      (currentTime.getTime() - time.getTime()) / (1000 * 60)
    );

    if (timeDiffInMinutes < 360) {
      return;
    }
  }

  await sendNewMessageNotification(user);

  await prisma.userNotes.create({
    data: {
      userId: user.id,
      noteName: "lastTimeNotificationMessageDelivered",
      noteValue: new Date().toISOString(),
    },
  });
}

export const sendNewMessageNotification = async (user: any): Promise<void> => {
  const templateHtml = fs.readFileSync(
    "./src/templates/emails/client/newMessageNotification.hbs",
    "utf-8"
  );

  let content =
    "You have a new private message on Creo. Go now to https://creo.red to see it";
  const contentEN =
    "You have a new private message on Creo. Go now to https://creo.red to see it";
  const contentES =
    "Tienes un nuevo mensaje privado en Creo. Accede ahora a la https://creo.red para verlo";
  const contentPT =
    "Você tem uma nova mensagem privada no Creo. Vá agora para https://creo.red para vê-lo";
  let title = "Welcome";
  const titleEn = "New private message on Creo";
  const titleEs = "Nuevo mensaje en Creo.red";
  const titlePt = "Nova mensagem no Creo.red";

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
  type: string,
  content: string,
  pubsub,
  image?: string
): Promise<void> => {
  try {
    const job = {
      userId: userId,
      image: image,
      type: type,
      content: content,
    };

    const notification = await prisma.notification.create({
      data: {
        userId: job.userId,
        image: job.image ?? "",
        type: job.type as any,
        content: job.content,
      },
    });

    const notificationsNotReaded = await prisma.notification.count({
      where: {
        userId: userId,
        viewed: false,
      },
    });

    let payload = {
      userId: job.userId,
      notificationsCount: notificationsNotReaded,
    };

    pubsub.publish("NEW_INTERNAL_NOTIFICATION", payload);
  } catch (error) {
    throw new Error(error);
  }
};
