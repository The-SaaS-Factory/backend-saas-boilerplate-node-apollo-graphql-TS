import nodemailer from "nodemailer";
import { getSuperAdminSetting } from "../facades/adminFacade.js";

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
