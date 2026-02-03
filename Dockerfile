# Stage 1: Base image
FROM node:22.14.0-alpine AS base
WORKDIR /app
RUN npm i -g pnpm@10.6.5 @angular/cli@19.0.0
# COPY pnpm-lock.yaml ./
COPY package.json ./

# Stage 2: Install dependencies
FROM base AS dependencies-dev
RUN pnpm install
# RUN pnpm install --frozen-lockfile

# Stage 3: Build the app
FROM dependencies-dev AS build
COPY . .
COPY environment.ts ./src/shared/environment/environment.ts
COPY proxy.conf.json ./proxy.conf.json
RUN pnpm run build --configuration=production

# Stage 4: Deploy the app
FROM nginxinc/nginx-unprivileged:stable-alpine AS deploy
USER root
WORKDIR /usr/share/nginx/html
RUN rm -r /usr/share/nginx/html/*
COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/requerimientos-frontend-main/browser ./

# Ajustar permisos
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    chmod 755 /run

USER nginx
EXPOSE 4200
CMD ["nginx", "-g", "daemon off;"]
