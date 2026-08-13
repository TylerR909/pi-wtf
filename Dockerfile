# syntax=docker/dockerfile:1
# Multi-stage: build static assets, ship with nginx (edge-cacheable static site)

FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
# Skip prepare/lefthook — no git hooks in the image
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build \
  && test -f dist/index.html

FROM nginx:1.27-alpine AS runtime

LABEL org.opencontainers.image.title="piwtf" \
  org.opencontainers.image.description="Proprietary. Official image may be pulled and run for personal non-commercial use. Source is not open." \
  org.opencontainers.image.licenses="LicenseRef-AllRightsReserved" \
  org.opencontainers.image.source="https://github.com/TylerR909/pi-wtf" \
  org.opencontainers.image.url="https://piwtf.com"

# Static site only — compiled assets, not the source tree
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY LICENSE /LICENSE
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
