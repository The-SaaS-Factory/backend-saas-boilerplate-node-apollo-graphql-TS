import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export async function saveViewsForPublications(ids) {
 

  return await prisma.publication.updateMany({
    where: {
      id: {
        in: ids,
      },
    },
    data: {
      views: {
        increment: 1,
      },
    },
  });
}
