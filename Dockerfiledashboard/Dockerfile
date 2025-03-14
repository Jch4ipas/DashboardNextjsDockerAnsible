FROM --platform=linux/arm64 node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git && \
    git clone https://github.com/Jch4ipas/DashboardNextJs.git .

RUN npm install && npm run build

FROM --platform=linux/arm64 node:20-alpine

WORKDIR /app

COPY --from=builder /app /app

EXPOSE 3000

CMD ["npm", "run", "start"]
