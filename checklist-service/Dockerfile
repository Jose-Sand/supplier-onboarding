# ── Stage 1: builder ──────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install all deps first (layer cache friendly)
COPY package*.json ./
RUN npm ci

# Prisma schema + config needed for generate
COPY prisma/       ./prisma/
COPY prisma.config.ts ./

# Generate the Prisma TypeScript client into src/generated/prisma/
RUN npx prisma generate

# Compile TypeScript → dist/
COPY tsconfig.json ./
COPY src/          ./src/
RUN npm run build

# ── Stage 2: runner ───────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output (includes dist/generated/prisma from tsc)
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
