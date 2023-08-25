import Handlebars from "handlebars";
import fs from "fs";
import { sendMail } from "./mail.js";
import { PrismaClient } from "@prisma/client";
import { PubSub } from "graphql-subscriptions";

const prisma = new PrismaClient();

export const sendWelcomeEmail = async (user: any): Promise<void> => {
  const job = {
    emailType: "welcomeEmailBasic",
    user: user,
  };

  if (job.emailType == "welcomeEmailBasic") {
    const templateHtml = fs.readFileSync(
      "./src/templates/emails/client/wellcome.hbs",
      "utf-8"
    );

    let content =
      "Welcome to Creo.red, a social network designed and created by and for Christians from around the world. Our vision is to connect, edify, and prepare young people for the Great Commission using technology. Share Creo with your friends and help us grow!";
    const contentEN =
      "Welcome to Creo.red, a social network designed and created by and for Christians from around the world. Our vision is to connect, edify, and prepare young people for the Great Commission using technology. Share Creo with your friends and help us grow!";
    const contentES =
      "Binvenido a Creo.red, una red social pensada y creada por y para cristianos de todo el mundo. Nuestra visión es conectar, edificar y preparar a los jóvenes para la gran comisión usando la tecnología. ¡Comparte Creo con tus amigos y ayudanos a crecer!";
    const contentPT =
      "Bem-vindo(a) ao Creo.red, uma rede social pensada e criada por e para cristãos de todo o mundo. Nossa visão é conectar, edificar e preparar os jovens para a grande comissão usando a tecnologia. Compartilhe o Creo com seus amigos e nos ajude a crescer!";
    let title = "Welcome";
    const titleEn = "Welcome";
    const titleEs = "Bienvenid@";
    const titlePt = "Bem-vindo(a)";

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
  }
};

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
  pubsub: PubSub,
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

export const sendResetCodeEmail = async (
  userEmail: string,
  resetCode: string
): Promise<void> => {
  const job = {
    resetCode,
    userEmail,
  };

  const templateHtml = fs.readFileSync(
    "./src/templates/emails/client/resetPasswordEmail.hbs",
    "utf-8"
  );

  const template = Handlebars.compile(templateHtml);

  const html = template({ resetCode: job.resetCode });

  sendMail(job.userEmail, html, "Restaura tu cuenta");
};
