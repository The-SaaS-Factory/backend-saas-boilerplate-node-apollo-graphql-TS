import { PrismaClient } from "@prisma/client";
import { parentPort, workerData } from "worker_threads";
import { parseISO } from "date-fns";
import { PubSub } from "graphql-subscriptions";
const pubsub = new PubSub();
const prisma = new PrismaClient();
const propagatePublication = async () => {
  const { sendNotificationJob } = workerData;
   
  try {
    await prisma.timeline
      .createMany({
        data: sendNotificationJob.followers.map((follower) => ({
          publicationId: sendNotificationJob.publication.id,
          userId: follower.followerId,
        })),
      })
      .catch((error) => console.log(error));
     
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
};

propagatePublication();
