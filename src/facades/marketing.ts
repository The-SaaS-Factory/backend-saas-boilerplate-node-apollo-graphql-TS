import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function updateUserInEmailList(userId: number, listId: number) {
  const user = await prisma.user.findFirst({ where: { id: userId } });
  // if(user){
  const list = await prisma.marketingEmailListsMembers.findFirst({
    where: {
      listId: listId,
      userId: user.id,
      email: user.email,
    },
  });

  if (list) {
    await prisma.marketingEmailListsMembers.delete({
      where: {
        id: list.id,
      },
    });
  } else {
    await prisma.marketingEmailListsMembers.create({
      data: {
        listId: listId,
        userId: user.id,
        type: "PLATFORM",
        email: user.email,
      },
    });
  }
  // }
}
