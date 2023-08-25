import { typeDefs as UsersTypes, resolvers as UserResolvers } from "./users.js";
import {
  typeDefs as EconomyTypes,
  resolvers as EconomyResolvers,
} from "./economy.js";
import {
  typeDefs as CommunityTypes,
  resolvers as CommunityResolvers,
} from "./community.js";
import {
  typeDefs as ConversationTypes,
  resolvers as ConversationResolvers,
} from "./messages.js";
import {
  typeDefs as MembershipTypes,
  resolvers as MembershipResolvers,
} from "./membership.js";
import {
  typeDefs as CurrenciesTypes,
  resolvers as CurrenciesResolvers,
} from "./currencies.js";
import {
  typeDefs as PublicationTypes,
  resolvers as PublicationResolvers,
} from "./publications.js";
import {
  typeDefs as AdministrationTypes,
  resolvers as AdministrationResolvers,
} from "./administration.js";

const RootQuery = `
  type Query {
    _: String
  }
`;

const typeDefs = [
  RootQuery,
  EconomyTypes,
  MembershipTypes,
  CommunityTypes,
  UsersTypes,
  CurrenciesTypes,
  PublicationTypes,

  AdministrationTypes,
  ConversationTypes,
];
const resolvers = [
  UserResolvers,
  EconomyResolvers,
  MembershipResolvers,
  PublicationResolvers,
  CommunityResolvers,
  CurrenciesResolvers,
  AdministrationResolvers,
  ConversationResolvers,
];

export { typeDefs, resolvers };
