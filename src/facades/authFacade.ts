import { PubSub } from "graphql-subscriptions";
import { convertToSlug } from "./strFacade.js";
import { sendInternalNotificatoin } from "./notificationFacade.js";

export function generateSecureResetCode() {
  const codeLength = 7;
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < codeLength; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

export const isUsernameAvailable = async (tx, username) => {
  const existingUser = await tx.user.findFirst({
    where: {
      username: username,
    },
  });

  return !existingUser;
};

export const generateUniqueUsername = async (tx, name) => {
  let username = convertToSlug(name);
  let isAvailable = await isUsernameAvailable(tx, username);
  let counter = 2;

  while (!isAvailable) {
    const newUsername = `${username}-${counter}`;
    isAvailable = await isUsernameAvailable(tx, newUsername);
    username = newUsername;
    counter++;
  }

  return username;
};

 