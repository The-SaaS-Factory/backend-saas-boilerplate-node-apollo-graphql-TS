import { PrismaClient } from "@prisma/client";
import { notifyAdmin } from "../facades/notificationFacade.js";
import {
  checkPermission,
  hasPermission,
  returnUnauthorized,
} from "../facades/scurityFacade.js";
import { MyContext } from "../types/MyContextInterface.js";
const prisma = new PrismaClient();

const typeDefs = `#graphql
type SupportTicketType {
    id: Int,
    subject: String
    departament: String
    status: String
    userId: Int
    SupportTicketMessage: [SupportTicketMessage]
    createdAt: String
    updatedAt: String
   
  }

  type SupportTicketMessage {
    id: Int,
    userId: Int,
    SupportTicketMessageContent: [SupportTicketContentType]
    createdAt: String
    updatedAt: String 
    user: User
  }

 type SupportTicketContentType {
    id: Int,
    type: String
    content: String
    createdAt: String
    updatedAt: String
  }

  input SupportTicketContentInput {
    content: String
    type: String
}
 
  extend type Query {
    getSupportTickets: [SupportTicketType]
    getSupportTicketsForUser: [SupportTicketType]
    getSupportTicket(ticketId: Int): SupportTicketType
  }
  extend type Mutation {
    createSupportTicket(
        subject: String,
        departament: String,
        contents:[SupportTicketContentInput]
    ): SupportTicketType
    createMessageForSupportTicket(
        ticketId: Int!,
        contents:[SupportTicketContentInput]
    ): SupportTicketMessage
    closeSupportTicket(
        ticketId: Int!,
    ): Boolean
  }
  `;

const resolvers = {
  Query: {
    getSupportTickets: async (
      root: any,
      args: { id: number },
      context: MyContext
    ) => {
      checkPermission(context.user.permissions, "superAdmin:support:read");

      return await prisma.supportTicket.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });
    },
    getSupportTicketsForUser: async (root: any, args: {}, MyContext) => {
      return await prisma.supportTicket.findMany({
        where: {
          userId: MyContext.user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    },
    getSupportTicket: async (
      root: any,
      args: { ticketId: number },
      MyContext
    ) => {
      const ticket = await prisma.supportTicket.findUnique({
        where: {
          id: args.ticketId,
        },
        include: {
          SupportTicketMessage: {
            include: {
              SupportTicketMessageContent: true,
              user: {
                select: {
                  name: true,
                  email: true,
                  id: true,
                  Membership: {
                    select: {
                      id: true,
                      plan: {
                        select: {
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (
        ticket.userId == MyContext.user.id ||
        hasPermission(MyContext.user.permissions, "superAdmin:support:read")
      ) {
        return ticket;
      }

      return null;
    },
  },
  Mutation: {
    createSupportTicket: async (root: any, args: any, MyContext) => {
      return await prisma.$transaction(
        async (tx) => {
          try {
            const user = MyContext.user;

            //1 - Create the ticket
            const ticket = await tx.supportTicket.create({
              data: {
                User: {
                  connect: {
                    id: user.id,
                  },
                },
                subject: args.subject,
                departament: args.departament,
              },
            });

            const firstMessage = await tx.supportTicketMessage.create({
              data: {
                ticketId: ticket.id,
                userId: user.id,
              },
            });

            const contents = await Promise.all(
              args.contents.map(async (content: any) => {
                let data = content.content;

                return {
                  messageId: firstMessage.id,
                  content: data,
                  type: content.type,
                };
              })
            );

            //2-save the content of the ticket content
            if (contents) {
              await tx.supportTicketMessageContent.createMany({
                data: contents,
              });
            }

            notifyAdmin("INTERNAL", "New Support Ticket");

            return ticket;
          } catch (error) {
            console.log(error);
            throw new Error(error);
          }
        },
        {
          maxWait: 10000, // default: 2000
          timeout: 15000, // default: 5000
        }
      );
    },
    createMessageForSupportTicket: async (root: any, args: any, MyContext) => {
      return await prisma.$transaction(
        async (tx) => {
          try {
            const user = MyContext.user;

            const ticket = await prisma.supportTicket.findUnique({
              where: {
                id: args.ticketId,
              },
            });

            let status: any = "OPEN"; //#Fix

            if (ticket.userId != MyContext.user.id) {
              
              if (!hasPermission(MyContext.user.permissions, "superAdmin:support:write")) {
                returnUnauthorized();
              }

              status = "AWAITING_RESPONSE";
            } else {
              if ((ticket.status as string) == "AWAITING_RESPONSE") {
                status = "UNDER_REVIEW";
              }
            }

            await prisma.supportTicket.update({
              where: {
                id: args.ticketId,
              },
              data: {
                status: status,
              },
            });

            const firstMessage = await tx.supportTicketMessage.create({
              data: {
                ticketId: args.ticketId,
                userId: user.id,
              },
            });

            const contents = await Promise.all(
              args.contents.map(async (content: any) => {
                let data = content.content;

                return {
                  messageId: firstMessage.id,
                  content: data,
                  type: content.type,
                };
              })
            );

            //2-save the content of the ticket content
            if (contents) {
              await tx.supportTicketMessageContent.createMany({
                data: contents,
              });
            }

            return firstMessage;
          } catch (error) {
            console.log(error);
            throw new Error(error);
          }
        },
        {
          maxWait: 10000, // default: 2000
          timeout: 15000, // default: 5000
        }
      );
    },
    closeSupportTicket: async (root: any, args: any, MyContext) => {
      return await prisma.$transaction(
        async (tx) => {
          try {
            const ticket = await prisma.supportTicket.findUnique({
              where: {
                id: args.ticketId,
              },
            });

            if (
              ticket.userId === MyContext.user.id ||
              hasPermission(MyContext.user.permissions, "superAdmin:support:write")
            ) {
              const user = MyContext.user;

              await prisma.supportTicket.update({
                where: {
                  id: args.ticketId,
                },
                data: {
                  status: "CLOSED",
                },
              });
              return true;
            }
            return false;
          } catch (error) {
            console.log(error);
            throw new Error(error);
          }
        },
        {
          maxWait: 10000, // default: 2000
          timeout: 15000, // default: 5000
        }
      );
    },
  },
};

export { typeDefs, resolvers };
