import nodemailer from "nodemailer";
import { env } from "process";

// async..await is not allowed in global scope, must use a wrapper
export const sendMail = async (
  email: string,
  html: string,
  subject: string
): Promise<void> => {
  try {
    // create reusable transporter object using the default SMTP transport
    //Use test o prod credential by env.mode
    let transporter = null;
   
    
    if (env.EMAIL_MODE === "test") {
      transporter = nodemailer.createTransport({
        host: env.SMTP_HOST_TEST,
        port: env.SMTP_PORT_TEST,
        auth: {
          user: env.SMTP_USER_TEST,
          pass: env.SMTP_PASSWORD_TEST, // naturally, replace both with your real credentials or an application-specific password
        },
      });
    } else {
      //Habilitar por tls
      transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: true,  
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASSWORD, // naturally, replace both with your real credentials or an application-specific password
        },
      });
    }

 
    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: '"Creo Red" <info@creo.red>', // sender address #777
      to: email, // list of receivers
      subject: subject, // Subject line
      // text: "Hello world?", // plain text body
      html: html, // html body
    });

    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
  } catch (error) {
    console.log(error);
  }
};
