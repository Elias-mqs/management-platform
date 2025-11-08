# Development Dockerfile for Next.js
FROM node:20-alpine

# Install pnpm (specify version to match lockfile)
RUN npm install -g pnpm@9

WORKDIR /app

# Copy root package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy web package files
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/web ./apps/web
COPY turbo.json ./

WORKDIR /app

EXPOSE 3000

CMD ["pnpm", "dev", "--filter=@networking-groups/web"]
