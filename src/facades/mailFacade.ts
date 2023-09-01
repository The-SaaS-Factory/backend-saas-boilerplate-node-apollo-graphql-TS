import nodemailer from "nodemailer";
import { getSuperAdminSetting } from "../facades/adminFacade.js";
import fs from "fs";
 
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
  