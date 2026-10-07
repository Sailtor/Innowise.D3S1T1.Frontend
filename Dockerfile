# Build stage: npm ci + ng build (SSR) produces a self-contained dist/ output - no
# node_modules needed at runtime, so the final stage never copies them.
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage: just the built output and a bare node runtime.
FROM node:22-alpine AS final
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000
COPY --from=build /app/dist/Innowise.D3S1T1.Frontend ./dist/Innowise.D3S1T1.Frontend

# No curl/wget needed for the probe - unlike the .NET images, this one already ships
# node, so the healthcheck is a plain http GET via node's own http module.
HEALTHCHECK --interval=10s --timeout=5s --retries=10 --start-period=15s \
  CMD node -e "require('http').get('http://localhost:4000/', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/Innowise.D3S1T1.Frontend/server/server.mjs"]
