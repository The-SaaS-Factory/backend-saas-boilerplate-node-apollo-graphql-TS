import { convertToSlug } from "./str.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const isSlugAvailable = async (tx, username) => {
  const existingUser = await tx.user.findFirst({
    where: {
      username: username,
    },
  });

  return !existingUser;
};

export const generateUniqueUsernameForCommunity = async (name) => {
  let username = convertToSlug(name);
  let isAvailable = await isSlugAvailable(prisma, username);
  let counter = 2;

  while (!isAvailable) {
    const newUsername = `${username}-${counter}`;
    isAvailable = await isSlugAvailable(prisma, newUsername);
    username = newUsername;
    counter++;
  }

  return username;
};
