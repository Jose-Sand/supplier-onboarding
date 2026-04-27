# ── Stage 1: builder ──────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma/       ./prisma/
COPY prisma.config.ts ./

RUN npx prisma generate

COPY tsconfig.json ./
COPY src/          ./src/
RUN npm run build

# ── Stage 2: runner ───────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/main.js"]
