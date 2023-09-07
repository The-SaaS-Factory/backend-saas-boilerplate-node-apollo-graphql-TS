import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const typeDefs = `#graphql
  type ResourceType {
    id: Int,
    name: String
    type: String
    description: String
    linkDownload: String
    linkVideo: String
    linkDemo: String
    resume: String
    image: String
  }
  extend type Query {
    getResources: [ResourceType]
    getResource(slug: String!): ResourceType
  }
  extend type Mutation {
    createResource(
     name: String!,
     slug: String!,
     type: String,
     description: String,
     linkDownload: String!,
     linkVideo: String,
     linkDemo: String,
     resume: String,
     image: String,
    ): ResourceType
  }
  `;

const resolvers = {
  Query: {
    getResources: async (root: any, args: any) => {
      return prisma.resources.findMany({
        orderBy: {
          createdAt: "desc",
        },
        select: {
          name: true,
          image: true,
          resume: true,
        },
      });
    },
    getResource: async (root: any, args: { slug: string }) => {
      return prisma.resources.findFirst({
        where: {
          slug: args.slug,
        },
      });
    },
  },
  Mutation: {
    createResource: async (root: any, args: any) => {
      const slug = args.slug;
      const slugTest = await prisma.resources.findFirst({
        where: {
          slug: slug,
        },
      });

      if (slugTest) {
        throw new Error("Slug already exists");
      }
      console.log(args);
      
      return await prisma.resources.create({
        data: {
          name: args.name,
          slug: args.slug,
          type: args.type,
          description: args.description,
          linkDownload: args.linkDownload,
          linkVideo: args.linkVideo,
          linkDemo: args.linkDemo,
          resume: args.resume,
          image: args.image,
        },
      });
    },
  },
};

export { typeDefs, resolvers };
