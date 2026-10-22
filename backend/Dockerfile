FROM node:24.22.1-alpine3.24

WORKDIR /app/backend

# Install project dependencies.
COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm npm ci

# Copy application source.
COPY . .

ENV NODE_ENV=development

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
