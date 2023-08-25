import { PubSub } from "graphql-subscriptions";
import { sendInternalNotificatoin } from "../workers/jobs.js";
import { convertToSlug } from "./str.js";
import pubsub from "../facades/pubSubFacade.js";
export function generateSecureResetCode() {
  const codeLength = 7; // Longitud del código
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"; // Caracteres permitidos
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

export const assignLevelToUser = async (client, userId) => {
  const userAmount = await client.userAmounts.findFirst({
    where: {
      userId: userId,
      currencyId: 2,
    },
  });

  if (!userAmount) {
    return;
  }

  let levelId = 1;

  const points = userAmount.amount;

  if (points < 200) {
    levelId = 1;
  } else if (points >= 200 && points < 300) {
    levelId = 2;
  } else if (points >= 300 && points < 400) {
    levelId = 3;
  } else if (points >= 400 && points < 500) {
    levelId = 4;
  } else if (points >= 500 && points < 600) {
    levelId = 5;
  } else if (points >= 600 && points < 700) {
    levelId = 6;
  } else if (points >= 700 && points < 800) {
    levelId = 7;
  } else if (points >= 800 && points < 900) {
    levelId = 8;
  } else if (points >= 900 && points < 1000) {
    levelId = 9;
  } else if (points >= 1000 && points < 1100) {
    levelId = 10;
  } else if (points >= 1100 && points < 1200) {
    levelId = 11;
  } else if (points >= 1200 && points < 1300) {
    levelId = 12;
  } else {
    // Asignar un nivel predeterminado si no se cumple ningún rango
    levelId = 1;
  }

  const level = await client.level.findUnique({
    where: {
      id: levelId,
    },
  });

  const user = await client.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (level && user) {
    if (user.levelId < levelId) {
      sendNotification(
        "INTERNAL",
        user.id,
        "ACCOUNT",
        "Congratulations, you reached level:," + levelId,
        pubsub,
        ""
      );
    }

    const userUpadate = await client.user.update({
      where: {
        id: user.id,
      },
      data: {
        levelId: levelId,
      },
    });
  }

  return;
};

export const sendNotification = async (
  typeNotification: string,
  userId: number,
  type: string,
  content: string,
  pubsub: PubSub,
  image?: string
) => {
  if (typeNotification === "INTERNAL") {
    //Internal Notification
    return sendInternalNotificatoin(userId, type, content, pubsub, image);
  }
};
