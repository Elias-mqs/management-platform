# Development Dockerfile for API
FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Install pnpm (specify version to match lockfile)
RUN npm install -g pnpm@9

WORKDIR /app

# Copy root package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy API package files
COPY apps/api/package.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy API source code
COPY apps/api ./apps/api
COPY turbo.json ./

# Generate Prisma Client
RUN cd apps/api && pnpm prisma:generate

WORKDIR /app

EXPOSE 3333

CMD ["pnpm", "dev", "--filter=@networking-groups/api"]
