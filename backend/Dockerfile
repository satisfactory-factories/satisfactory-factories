FROM node:20.17

# Install pnpm
RUN npm install -g pnpm

COPY . /app
WORKDIR /app

RUN pnpm install

CMD ["pnpm", "start"]