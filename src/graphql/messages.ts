import { PrismaClient } from "@prisma/client";

import { PubSub, withFilter } from "graphql-subscriptions";
const prisma = new PrismaClient();
import pubsub from "../facades/pubSubFacade.js";
import { MyContext } from "../types/MyContextInterface";
import { notify } from "../facades/notification.js";

const typeDefs = `#graphql

type Conversation {
  id: Int!
  ref: String
  messages: [MessageType!]!
  status: String
  participants: [ConversationParticipant]
  createdAt: String!
  updatedAt: String!
}

type ConversationParticipant {
  id: Int!
  userId: Int
  user: User
  conversationId: Int
  conversation: Conversation
  hasSeenLatestMessage: Boolean
  createdAt: String
  updatedAt: String
}

type MessageType {
  id: String!
  conversationId: Int!
  conversation: Conversation!
  senderId: Int!
  sender: User!
  recipientId: Int
  recipient: User
  content: String!
  viewed: Int!
  deleted_at: String
  sent_at: String
  createdAt: String
}

  
  type MessageSuscription {
    chatId: String
    senderId: Int
    messageId: Int
  }

   
 extend type Query {
    getChat(chatId:String): Conversation
    getChatsForUser: [Conversation]
    getMessagesForUser(chatId:String): [MessageType]
    }
 extend type Mutation {
     startChat(receiverId: Int!): String
     sendChatMessage(
      content: String!, 
      chatId: String,
      recipientId: Int,
     ): MessageType
     sendWritingMessageOnChatSignal(chatId: String, senderId: Int): Boolean
    }


  type Subscription {
    newMessageOnChat(
      chatId: String!
      messageId: Int
    ): MessageSuscription
    writingMessageOnChat(chatId: String!, senderId: Int!): MessageSuscription
   }


`;

const resolvers = {
  Query: {
    getChat: async (root: any, args: any, context: MyContext) => {
      return await prisma.conversation.findFirst({
        where: {
          ref: args.chatId,
        },
        include: {
          participants: {
            select: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar_thumbnail: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    },
    getChatsForUser: async (root: any, args: any, context: MyContext) => {
      const userId = context.user.id; // Obtén el ID del usuario de los argumentos

      // Busca las conversaciones del usuario
      const userConversations = await prisma.conversationParticipant.findMany({
        where: {
          userId: userId,
        },
        include: {
          conversation: {
            include: {
              messages: {
                orderBy: {
                  createdAt: "desc", // Ordena los mensajes por fecha de más reciente a más antigua
                },
              },
              participants: {
                select: {
                  user: {
                    select: {
                      username: true,
                      name: true,
                      avatar_thumbnail: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Obtén solo las conversaciones de la lista y elimina los datos innecesarios
      const conversations = userConversations.map(
        (participant) => participant.conversation
      );

      return conversations;
    },
    getMessagesForUser: async (root: any, args: any, context: MyContext) => {
      const { chatId } = args;

      return prisma.message.findMany({
        where: {
          conversationId: chatId,
        },
        include: {
          recipient: {
            select: {
              id: true,
              avatar_thumbnail: true,
              name: true,
              username: true,
            },
          },
          sender: {
            select: {
              id: true,
              avatar_thumbnail: true,
              name: true,
              username: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });
    },
  },
  Mutation: {
    sendChatMessage: async (root: any, args: any, context: MyContext) => {
      try {
        const { content, chatId, recipientId } = args;

        const message = await prisma.message.create({
          data: {
            content: content,
            conversationId: chatId,
            recipientId: recipientId,
            senderId: context.user.id,
            viewed: false,
          },
        });

        if (message) {
          console.log(chatId);
          
          pubsub.publish("NEW_MESSAGE_ON_CHAT", {
            chatId: chatId,
            messageid: message.id,
          });

          notify(recipientId,'newMessage');

        }

        return message;
      } catch (error) {
        console.log(error);
      }
    },
    startChat: async (root: any, args: any, context: MyContext) => {
      try {
        const oldChat = await prisma.message.findFirst({
          where: {
            OR: [
              { recipientId: args.receiverId, senderId: context.user.id },
              { recipientId: context.user.id, senderId: args.receiverId },
            ],
          },
        });

        const conversation = await prisma.conversation.upsert({
          where: {
            ref: oldChat ? oldChat.conversationId : "0",
          },
          create: {
            participants: {
              create: [
                {
                  userId: context.user.id,
                  hasSeenLatestMessage: false,
                },
                {
                  userId: args.receiverId,
                  hasSeenLatestMessage: false,
                },
              ],
            },
          },
          update: {},
        });

        return conversation ? conversation.ref : null;
      } catch (error) {
        console.log(error);
      }
    },
    sendWritingMessageOnChatSignal: async (
      root: any,
      args: any,
      context: MyContext
    ) => {
      pubsub.publish("WRITING_MESSAGE_ON_CHAT", {
        chatId: args.chatId,
        senderId: args.senderId,
      });

      return true;
    },
  },
  Subscription: {
    newMessageOnChat: {
      resolve: (payload, args, context, info) => {
        return payload;
      },
      subscribe: withFilter(
        () => pubsub.asyncIterator("NEW_MESSAGE_ON_CHAT"),
        (payload, variables) => {
          return payload.chatId === variables.chatId;
        }
      ),
    },
    writingMessageOnChat: {
      resolve: (payload, args, context, info) => {
        return payload;
      },
      subscribe: withFilter(
        () => pubsub.asyncIterator("WRITING_MESSAGE_ON_CHAT"),
        (payload, variables) => {
          return payload.chatId === variables.chatId;
        }
      ),
    },
  },
};

export { typeDefs, resolvers };
