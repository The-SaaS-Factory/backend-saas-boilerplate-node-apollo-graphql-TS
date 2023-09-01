import { sendNewMessageNotification } from "../workers/jobs.js";
import { PrismaClient, User } from "@prisma/client";

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
