

# The SaaS Factory 
## _The Boilerplate for SaaS Products, Free and Open Source_
 
The SaaS Factory is a boilerplate for avanded SaaS products. It's free and open source, and it's powered by Apollo GraphQL , React, Tailwind CSS, and TypeScript
 ![enter image description here](https://ik.imagekit.io/cluzstudio/01-cluzstudio/Sem%20t%C3%ADtulo-2023-12-19-2206_cO2HqHxMM.png?updatedAt=1703035291143)

- [Frontend App - Vite - React - Tailwind CSS, Apollo Client, Graphql, TypeScript](https://github.com/The-SaaS-Factory/frontend-saas-boilerplate-react-apollo-graphql-TS) 
- Backend App - Node - [Apollo Server](https://www.apollographql.com/docs/apollo-server/) - [Graphql](https://graphql.org/) - [Prisma  ](https://www.prisma.io/)  **(This repo)** 
- Integrations: Stripe, [Imagekit](https://imagekit.io/), [Loops So](https://loops.so/)

## Features
soon!!

## installation

 1. Download or clone the repop.
 2. In rootwrite: `npm install`
 3. Create a MySQL DB in your local environment (Xampp, Wamp, Laragon, etc).
 4. Rename the .env.example file to .env
 5. Edit the DATABASE_URL line with the name of your database and the local connection data
 6. Write in the terminal of your editor or PC: `npx prisma db push`
 7. Load the test data (admin user, roles, etc.) from the database with: `npx prisma db seed`
 8. Raise the development server to serve the frontend with: `npm run start`

    ***Start building your saas***
