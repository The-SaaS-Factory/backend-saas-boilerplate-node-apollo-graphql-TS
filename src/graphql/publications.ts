import { PrismaClient, PublicationType } from "@prisma/client";
import { PubSub, withFilter } from "graphql-subscriptions";

const prisma = new PrismaClient();
import pubsub from "../facades/pubSubFacade.js";

import { MyContext } from "../types/MyContextInterface";
import _ from "lodash";
 
import { saveViewsForPublications } from "../facades/stats.js";

const typeDefs = `#graphql
  type Post {
    id: ID!
    reaction: String
    type: String 
    views: Int
    user: User
    parent: Post
    contents: [PublicationContentType]
    comments: [Post]
    _count: PublicationCount
  }

  
  type PublicationCount {
    comments: Int
  }
 

  input PublicationContentInput {
  content: String  
  type: String
}

type PostCreated {
  postId: Int,
  userId: Int,
  user: User
}


type Query {
    getPublicationsByType(type:String!,orderBy:String,limit: Int, offset: Int): [Post]
    getPublication(id:Int): Post,
    getCommentsInPost(postId:Int, offset:Int, limit:Int): [Post]
}
 
type PublicationContentType {
    id: Int
    content: String
    type: String
}

type Mutation {
    createPublication(
      type: String
      contents:[PublicationContentInput]
      reaction: String
      communityId: Int
    ): Post
    createCommentInPost(
      postId: Int!
      contents:[PublicationContentInput]
    ): Post
}

type Subscription {
    postCreated(
      userId: Int!
    ): PostCreated
}`;

const resolvers = {
  Query: {
    getPublication: async (root: any, args: { id: number }) => {
      const publication = await prisma.publication.findFirst({
        where: {
          id: args.id,
        },
        include: {
          user: {
            include: {
              Membership: true,
            },
          },
          contents: true,
          parent: {
            select: {
              id: true,
              user: {
                include: {
                  Membership: true,
                },
              },
            },
          },
          comments: {
            include: {
              user: {
                include: {
                  Membership: true,
                },
              },
              parent: {
                select: {
                  id: true,
                  user: {
                    include: {
                      Membership: true,
                    },
                  },
                },
              },
              contents: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
      });

      return publication;
    },

    getCommentsInPost: async (root: any, args: any, context: MyContext) => {
      const limit = args.limit;
      const offset = args.offset;
      const comments = await prisma.publication.findMany({
        where: {
          parentId: args.postId,
        },
        skip: offset,
        take: limit,
        include: {
          user: {
            include: {
              Membership: true,
            },
          },
          contents: true,
          parent: {
            select: {
              id: true,
              user: {
                include: {
                  Membership: true,
                },
              },
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const ids = comments.map((post) => post.id);
      saveViewsForPublications(ids);

      return comments;
    },
    getPublicationsByType: async (root: any, args: any, context: MyContext) => {
      try {
        const limit = args.limit;
        const offset = args.offset;

        let orderByRaw = null;
        const orderBy = args.orderBy;

        if (orderBy === "likes") {
          orderByRaw = {
            PublicationLikes: {
              _count: "desc",
            },
          };
        }

        const publications = await prisma.publication.findMany({
          where: {
            type: args.type,
          },
          skip: offset,
          take: limit,
          include: {
            user: {
              include: {
                Membership: true,
              },
            },
            contents: true,
            parent: {
              select: {
                id: true,
                user: {
                  include: {
                    Membership: true,
                  },
                },
              },
            },
            _count: {
              select: {
                comments: true,
              },
            },
          },
          orderBy: orderByRaw,
        });

        const ids = publications.map((post) => post.id);
        saveViewsForPublications(ids);

        return publications;
      } catch (error) {
        console.log(error);
      }
    },
  },
  Mutation: {
    createPublication: async (
      root: any,
      args: {
        type: PublicationType;
        contents: any;
        reaction: string;
        communityId: number;
      },
      MyContext
    ) => {
      return await prisma.$transaction(
        async (tx) => {
          try {
            const user = MyContext.user;
            const publication = await tx.publication.create({
              data: {
                user: {
                  connect: {
                    id: user.id,
                  },
                },
                scope: args.communityId ? "COMMUNITY" : "PROFILE",
                type: args.type,
                reaction: args.reaction,
              },
              include: {
                user: {
                  include: {
                    Membership: true,
                  },
                },
              },
            });

            const contents = await Promise.all(
              args.contents.map(async (content: any) => {
                let data = content.content;

                return {
                  publicationId: publication.id,
                  content: data,
                  type: content.type,
                };
              })
            );

            if (contents) {
              await tx.publicationContent.createMany({
                data: contents,
              });
            }
            return publication;
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
    createCommentInPost: async (
      root: any,
      args: {
        postId: number;
        contents: any;
      },
      MyContext
    ) => {
      return await prisma.$transaction(
        async (tx) => {
          try {
            const user = MyContext.user;

            //1 - Create the publication
            const publication = await tx.publication.create({
              data: {
                userId: user.id,
                parentId: args.postId,
              },
            });

            const contents = await Promise.all(
              args.contents.map(async (content: any) => {
                let data = content.content;

                return {
                  publicationId: publication.id,
                  content: data,
                  type: content.type,
                };
              })
            );

            //2-save the content of the publication
            if (contents) {
              await tx.publicationContent.createMany({
                data: contents,
              });
            }

            //propagatePublicationWithFollowers(user, publication, pubsub);

            return publication;
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
  Subscription: {
    postCreated: {
      resolve: (payload, args, context, info) => {
        return payload.postCreated;
      },

      subscribe: withFilter(
        () => pubsub.asyncIterator("POST_CREATED"),
        (payload, variables) => {
          return payload.postCreated.userId === variables.userId;
        }
      ),
    },
  },
};

export { typeDefs, resolvers };
