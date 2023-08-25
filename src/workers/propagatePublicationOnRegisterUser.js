import { PrismaClient } from "@prisma/client";
import { parentPort, workerData } from "worker_threads";
import { parseISO } from "date-fns";

const prisma = new PrismaClient();
const propagatePublicationOnRegisterUser = async () => {
  const { publications, finalUserId } = workerData;

  try {
    await Promise.all(
      publications.map(async (post) => {
        await prisma.timeline.create({
          data: {
            user: {
              connect: {
                id: finalUserId,
              },
            },
            publication: {
              connect: {
                id: post.id,
              },
            },
          },
        });
      })
    );
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
};

propagatePublicationOnRegisterUser();
