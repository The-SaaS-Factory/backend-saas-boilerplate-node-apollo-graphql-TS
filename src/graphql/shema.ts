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
  UsersTypes,
  InvoiceTypes,
  CurrenciesTypes,
  AdministrationTypes,
];
const resolvers = [
  UserResolvers,
  EconomyResolvers,
  MembershipResolvers,
  InvoiceResolvers,
  CurrenciesResolvers,
  AdministrationResolvers,
];

export { typeDefs, resolvers };
