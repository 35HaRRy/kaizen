FROM node:26.13.0-alpine AS base
WORKDIR /app
RUN npm install --global pnpm@11.20.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY api/package.json ./api/package.json

FROM base AS dependencies
RUN pnpm install --filter @kaizen/api... --frozen-lockfile --ignore-scripts

FROM dependencies AS build
COPY api/tsconfig*.json ./api/
COPY api/src ./api/src
COPY api/tools ./api/tools
COPY shared ./shared
RUN pnpm -C api build

FROM base AS production-dependencies
RUN pnpm install --prod --filter @kaizen/api... --frozen-lockfile --ignore-scripts

FROM node:26.13.0-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3001
COPY --from=production-dependencies /app/package.json ./package.json
COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=production-dependencies /app/api/node_modules ./api/node_modules
COPY --from=build /app/dist/api ./api
COPY --from=build /app/dist/shared ./shared
USER node
EXPOSE 3001
CMD ["node", "api/src/server.js"]
