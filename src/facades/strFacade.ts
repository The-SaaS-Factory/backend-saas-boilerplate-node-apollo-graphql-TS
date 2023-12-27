import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
const prisma = new PrismaClient();

import crypto from "crypto";

export function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, characters.length);
    result += characters.charAt(randomIndex);
  }

  return result;
}


export function convertToSlug(text: string) {
  return text
    .toLowerCase()  
    .replace(/[\s\-]+/g, "-")  
    .replace(/[^\w\-]+/g, "")  
    .replace(/\-\-+/g, "-") 
    .replace(/^-+|-+$/g, "");  
}

interface Translation {
  [key: string]: string | Translation;
}

export async function traslateForUser(
  string: string,
  userId: number,
  variables?: Record<string, string>
): Promise<string> {
  const translations = JSON.parse(
    fs.readFileSync("./src/translations.json", "utf-8")
  ) as Translation;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  
  const langStr = getLanguageStringName(user.languageId);

  const translation = translations[langStr];

  const translatedString = findTranslation(string, translation) || string;
  return interpolateVariables(translatedString, variables);
}
export function traslate(
  string: string,
  languageId: number,
  variables?: Record<string, string>
): string {
  const translations = JSON.parse(
    fs.readFileSync("./src/translations.json", "utf-8")
  ) as Translation;

  const langStr = getLanguageStringName(languageId);

  const translation = translations[langStr];

  const translatedString = findTranslation(string, translation) || string;
   
  return interpolateVariables(translatedString, variables);
}

function getLanguageStringName(languageId: number) {
  switch (languageId) {
    case 1:
      return "en";
      break;
    case 2:
      return "es";
      break;
    case 3:
      return "pt";
      break;
    default:
      break;
  }
}

function findTranslation(
  key: string,
  translation: Translation | string
): string | undefined {
  const keys = key.split(".");
  let value: string | Translation | undefined = translation;

  for (const k of keys) {
    value = (value as Translation)[k];
    if (!value) {
      return undefined;
    }
  }

  return value as string;
}

function interpolateVariables(
  string: string,
  variables?: Record<string, string>
): string {
  if (!variables) {
    return string;
  }

  return string.replace(/{{\s*([^}]+)\s*}}/g, (match, variable) => {
    return variables[variable.trim()] || match;
  });
}

export const shuffleArray = (array: any[]) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const generateRandomNumber =() => {
  const min = 1000000000; // El número mínimo de 10 cifras (10^9)
  const max = 9999999999; // El número máximo de 10 cifras (10^10 - 1)
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function calculateMonthsFromDays(days: number) {
  const averageDaysPerMonth = 30.44;

  const months = days / averageDaysPerMonth;

  return months;
}