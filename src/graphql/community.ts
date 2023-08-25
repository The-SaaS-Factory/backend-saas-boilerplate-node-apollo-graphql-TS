import { PrismaClient } from "@prisma/client";
import { generateUniqueUsernameForCommunity } from "../facades/communityFacade.js";
import { MyContext } from "../types/MyContextInterface.js";

const prisma = new PrismaClient();

const typeDefs = `#graphql
 type CommunityType {
    id: Int
    userId: Int
    description: String
    name: String
    slug: String
    requestAccess: Boolean
    avatar: String
    cover: String
    createdAt: String
    user: User
    _count: CommunityCountTyep
  }

   type CommunityCountTyep {
    members: Int,
    timeline: Int
   }

    type CommunityMemberType {
    id: Int
    user: User
    status: String
    createdAt: String
  }
    type CommunityTimelineType {
    id: Int
    publication: Post
    readed: Boolean
    user: User
    createdAt: String
  }
 
   extend type Query {
    getRequestAccessPendingToCommunity(communityId: Int!): [CommunityMemberType]
    getAccessStatusToCommunityForUser(communityId: Int!): String
    getUserCommunities(userId: Int!): [CommunityType]
    getCommunityDetails(communityId: Int!): CommunityType
    getCommunities: [CommunityType]
    getCommunityMembers(communityId: Int!, limit: Int, offset: Int): [CommunityMemberType]
  }
  extend type Mutation {
    createCommunity(
     name: String!,
     avatar: String,
     description: String,
     requestAccess: Boolean
     cover: String
    ):CommunityType,
    deleteCommunity(
      communityId: Int!): CommunityType
    updateCommunity(
      communityId: Int!,
     name: String,
     slug: String,
     avatar: String,
     description: String,
     cover: String
     requestAccess: Boolean
    ): CommunityType
    requestAccessForCommunity(communityId: Int!): Boolean
    manageRequestAccess(communityId:Int!,userId: Int!,action: String!): Boolean
  }
  `;

const resolvers = {
  Query: {
    getRequestAccessPendingToCommunity: async (
      root: any,
      args: { communityId: number }
    ) => {
      const members = await prisma.communityMembers.findMany({
        where: {
          communityId: args.communityId,
          status: "PENDING",
        },
        include: {
          user: {
            select: {
              avatar: true,
              username: true,
              name: true,
              id: true,
              email: true,
              type: true,

              Membership: {
                select: {
                  endDate: true,
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
      });

      return members;
    },
    getAccessStatusToCommunityForUser: async (
      root: any,
      args: { communityId: number },
      context: MyContext
    ) => {
      const member = await prisma.communityMembers.findFirst({
        where: {
          communityId: args.communityId,
          userId: context.user.id,
        },
      });

      if (member) {
        return member.status;
      }

      return "not_request";
    },
    getCommunityDetails: async (root: any, args: { communityId: number }) => {
      return prisma.community.findUnique({
        where: { id: args.communityId },
        include: {
          user: {
            select: {
              avatar: true,
              username: true,
              id: true,
              email: true,
              type: true,

              Membership: {
                select: {
                  endDate: true,
                  plan: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              members: true,
              timeline: true,
            },
          },
        },
      });
    },
    getCurrencies: async (root: any, args: { id: number }) => {
      return prisma.adminCurrencies.findMany();
    },
    getCommunities: async (root: any, args: {}) => {
      return prisma.community.findMany({
        where: {
          deleteAt: null,
        },
        include: {
          user: {
            select: {
              avatar: true,
              username: true,
              id: true,
              email: true,
              type: true,

              Membership: {
                select: {
                  endDate: true,
                  plan: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              members: true,
              timeline: true,
            },
          },
        },
        orderBy: {
          members: {
            _count: "desc",
          },
        },
      });
    },
    getUserCommunities: async (root: any, args: { userId: number }) => {
      return prisma.community.findMany({
        where: {
          members: {
            some: {
              userId: args.userId,
            },
          },
        },
      });
    },
    getCommunityMembers: async (
      root: any,
      args: { communityId: number; offset: number; limit: number }
    ) => {
      return await prisma.communityMembers.findMany({
        where: {
          communityId: args.communityId,
          status: "ACTIVE",
        },
        skip: args.offset,
        take: args.limit,
        include: {
          user: {
            select: {
              username: true,
              name: true,
              avatar: true,
              avatar_thumbnail: true,
              id: true,
              resume: true,
              Membership: {
                select: {
                  id: true,
                  endDate: true,
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
      });
    },
  },
  Mutation: {
    createCommunity: async (root: any, args: any, context: MyContext) => {
      try {
        const slug = await generateUniqueUsernameForCommunity(args.name);

        const community = await prisma.community.create({
          data: {
            name: args.name,
            slug: slug,
            description: args.description,
            userId: context.user.id,
            avatar: args.avatar,
            cover: args.cover,
            requestAccess: args.requestAccess,
          },
        });

        //add user as member
        await prisma.communityMembers.create({
          data: {
            communityId: community.id,
            userId: community.userId,
          },
        });

        return community;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    requestAccessForCommunity: async (
      root: any,
      args: any,
      context: MyContext
    ) => {
      const community = await prisma.community.findUnique({
        where: {
          id: args.communityId,
        },
      });

      if (community) {
        const status = community.requestAccess ? "PENDING" : "ACTIVE";

        const existUser = await prisma.communityMembers.findFirst({
          where: {
            userId: context.user.id,
            communityId: community.id,
          },
        });

        if (!existUser) {
          const member = await prisma.communityMembers.create({
            data: {
              userId: context.user.id,
              communityId: community.id,
              status: status,
            },
          });
          return true;
        }
      }
      return false;
    },
    updateCommunity: async (root: any, args: any, context: MyContext) => {
      const community = await prisma.community.findUnique({
        where: {
          id: args.communityId,
        },
      });

      if (community) {
        const dataToUpdate: any = {
          name: args.name || community.name,
          slug: args.slug || community.slug,
          description: args.description || community.description,
          avatar: args.avatar || community.avatar,
          cover: args.cover || community.cover,
          requestAccess:
            args.requestAccess === null
              ? community.requestAccess
              : args.requestAccess,
        };

        return await prisma.community.update({
          where: {
            id: community.id,
          },
          data: dataToUpdate,
        });
      }

      throw new Error("Community not found");
    },
    deleteCommunity: async (root: any, args: any, context: MyContext) => {
      const community = await prisma.community.findUnique({
        where: {
          id: args.communityId,
        },
      });

      if (community) {
        if (community.userId != context.user.id) {
          throw new Error("Not have permissions");
        }

        return await prisma.community.update({
          where: {
            id: community.id,
          },
          data: {
            deleteAt: new Date(),
          },
        });
      }

      throw new Error("Community not found");
    },
    manageRequestAccess: async (root: any, args: any, context: MyContext) => {
      try {
        const community = await prisma.community.findUnique({
          where: { id: args.communityId },
        });

        if (community) {
          if (community.userId != context.user.id) {
            throw new Error("Not Access");
          }
          const member = await prisma.communityMembers.findFirst({
            where: {
              communityId: args.communityId,
              userId: args.userId,
            },
          });

          if (member) {
            await prisma.communityMembers.update({
              where: {
                id: member.id,
              },
              data: {
                status: args.action === "1" ? "ACTIVE" : "RJECTED",
              },
            });

            return true;
          }
        }

        return false;
      } catch (error) {
        throw new Error(error.message);
      }
    },
  },
};

export { typeDefs, resolvers };
