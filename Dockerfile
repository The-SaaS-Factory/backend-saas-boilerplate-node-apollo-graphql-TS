# Use the official Node.js image as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json files to the container
COPY package*.json ./

# Install project dependencies
RUN npm install


# Copy the project files to the container
COPY . .

# Generar el cliente de Prisma
RUN npx prisma generate

# Build the TypeScript code
RUN npm run build

# Expose the port on which your application listens
EXPOSE 8080

# Start the application
CMD ["pm2-runtime", "./dist/src/index.js"]
 
