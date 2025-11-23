FROM node:22-alpine

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm install --production

COPY . .

EXPOSE 4004
