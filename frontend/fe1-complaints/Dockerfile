FROM node:20-alpine AS build
WORKDIR /app

# Baked into the JS bundle at BUILD time - must be the real public URL, never localhost
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/build ./build

EXPOSE 5173
CMD ["serve", "-s", "build", "-l", "5173"]
