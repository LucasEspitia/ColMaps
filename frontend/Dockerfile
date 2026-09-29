
FROM node:24-alpine

WORKDIR /app/frontend

COPY package*.json ./

RUN npm ci

COPY . .

ENV NODE_ENV=development

EXPOSE 4200

CMD ["npm", "start", "--", "--host", "0.0.0.0", "--poll", "1000"]
