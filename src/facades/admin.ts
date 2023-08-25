import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const generateKpi = async () => {
  //user_count_total
  await prisma.adminKpi.create({
    data: {
      name: "user_count_total",
      type: "counts",
      value: await prisma.user.count(),
    },
  });

  //user_count_total
  await prisma.adminKpi.create({
    data: {
      name: "post_count_total",
      type: "counts",
      value: await prisma.publication.count(),
    },
  });

 
  //memberships_actived_count_total
  await prisma.adminKpi.create({
    data: {
      name: "memberships_actived_count_total",
      type: "counts",
      value: await prisma.membership.count(),
    },
  });
};
