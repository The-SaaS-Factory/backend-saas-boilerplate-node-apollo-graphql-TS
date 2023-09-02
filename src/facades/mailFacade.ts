import nodemailer from "nodemailer";
import { getSuperAdminSetting } from "../facades/adminFacade.js";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import Handlebars from "handlebars";
const prisma = new PrismaClient();

export const sendMail = async (
  email: string,
  html: string,
  subject: string
): Promise<void> => {
  try {
    let transporter = null;
    const SMTP_MODE = await getSuperAdminSetting("SMTP_MODE");

    if (SMTP_MODE === "test") {
      const SMTP_HOST_TEST = await getSuperAdminSetting("SMTP_HOST_TEST");
      const SMTP_PORT_TEST = await getSuperAdminSetting("SMTP_PORT_TEST");
      const SMTP_USER_TEST = await getSuperAdminSetting("SMTP_USER_TEST");
      const SMTP_PASSWORD_TEST = await getSuperAdminSetting(
        "SMTP_PASSWORD_TEST"
      );
      transporter = nodemailer.createTransport({
        host: SMTP_HOST_TEST,
        port: SMTP_PORT_TEST,
        auth: {
          user: SMTP_USER_TEST,
          pass: SMTP_PASSWORD_TEST,
        },
      });
    } else {
      const SMTP_HOST = await getSuperAdminSetting("SMTP_HOST");
      const SMTP_PORT = await getSuperAdminSetting("SMTP_PORT");
      const SMTP_USER = await getSuperAdminSetting("SMTP_USER");
      const SMTP_PASSWORD = await getSuperAdminSetting("SMTP_PASSWORD");

      transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: true,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASSWORD,
        },
      });
    }

    const SMTP_SENDER_ADDRESS = await getSuperAdminSetting(
      "SMTP_SENDER_ADDRESS"
    );
    const PLATFORM_NAME = await getSuperAdminSetting("PLATFORM_NAME");

    let info = await transporter.sendMail({
      from: `"${PLATFORM_NAME}" ${SMTP_SENDER_ADDRESS}`,
      to: email,
      subject: subject,
      html: html,
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.log(error);
  }
};

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

    const language = await prisma.language.findFirst({
      where: {
        id: user.languageId,
      },
    });

    if (language) {
      const body = await getSuperAdminSetting(
        `MARKETING_EMAIL_WELCOME_BODY_${language.lng}`
      );
      const subject = await getSuperAdminSetting(
        `MARKETING_EMAIL_WELCOME_SUBJECT_${language.lng}`
      );
      const platformDescription = await getSuperAdminSetting("PLATFORM_RESUME");
      const platformAddress = await getSuperAdminSetting("PLATFORM_ADDRESS");
      const platformEmail = await getSuperAdminSetting("PLATFORM_EMAIL");
      const platformName = await getSuperAdminSetting("PLATFORM_NAME");

      const template = Handlebars.compile(templateHtml);

      const html = template({
        username: user.name,
        content: body,
        platformDescription,
        platformAddress,
        platformEmail,
        platformName,
        title: subject,
      });

      sendMail(user.email, html, subject);
    } else {
      throw new Error("Welcome Email not send, massage in language not found");
    }
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
