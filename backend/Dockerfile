FROM node:24-alpine
WORKDIR /app/backend

# Install project dependencies.
COPY package*.json ./

RUN npm ci

# Copy application source.
COPY . .

ENV NODE_ENV=development

EXPOSE 3000

CMD ["npm", "run", "start:dev"]