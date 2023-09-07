import { typeDefs as UsersTypes, resolvers as UserResolvers } from "./users.js";
import {
  typeDefs as EconomyTypes,
  resolvers as EconomyResolvers,
} from "./economy.js";
import {
  typeDefs as InvoiceTypes,
  resolvers as InvoiceResolvers,
} from "./invoices.js";
import {
  typeDefs as MembershipTypes,
  resolvers as MembershipResolvers,
} from "./membership.js";
import {
  typeDefs as CurrenciesTypes,
  resolvers as CurrenciesResolvers,
} from "./currencies.js";
 
import {
  typeDefs as ResourcesTypes,
  resolvers as ResourcesResolvers,
} from "./resources.js";
 
import {
  typeDefs as AdministrationTypes,
  resolvers as AdministrationResolvers,
} from "./administration.js";
import {
  typeDefs as SupportTypes,
  resolvers as SuportResolvers,
} from "./support.js";

const RootQuery = `
  type Query {
    _: String
  }
`;

const typeDefs = [
  RootQuery,
  EconomyTypes,
  ResourcesTypes,
  MembershipTypes,
  UsersTypes,
  InvoiceTypes,
  SupportTypes,
  CurrenciesTypes,
  AdministrationTypes,
];
const resolvers = [
  UserResolvers,
  EconomyResolvers,
  MembershipResolvers,
  InvoiceResolvers,
  SuportResolvers,
  ResourcesResolvers,
  CurrenciesResolvers,
  AdministrationResolvers,
];

export { typeDefs, resolvers };
