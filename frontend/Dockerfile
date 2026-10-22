
FROM node:24.22.1-alpine3.24

WORKDIR /app/frontend

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .

ENV NODE_ENV=development

EXPOSE 4200

CMD ["npm", "start", "--", "--host", "0.0.0.0"]
