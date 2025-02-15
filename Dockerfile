FROM node:20 AS build-env
COPY . /app
WORKDIR /app

COPY package.json .
COPY yarn.lock .

# Tell puppeteer to skip installing chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Install dependencies
RUN yarn install --frozen-lockfile --production

FROM gcr.io/distroless/nodejs20-debian12
COPY --from=build-env /app /app
WORKDIR /app
CMD ["index.js"]