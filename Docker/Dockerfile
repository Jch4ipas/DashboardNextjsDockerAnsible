FROM --platform=linux/arm64 node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

RUN git clone --depth 1 --filter=tree:0 https://github.com/Jch4ipas/DashboardNextjsDockerAnsible.git && \
    cd DashboardNextjsDockerAnsible && \
    git sparse-checkout init --cone && \
    git sparse-checkout set nextjs && \
    git checkout

RUN mv DashboardNextjsDockerAnsible/nextjs/* . && \
    rm -rf DashboardNextjsDockerAnsible
RUN npm install && npm run build

FROM --platform=linux/arm64 node:20-alpine

WORKDIR /app

COPY --from=builder /app /app

EXPOSE 3000

CMD ["npm", "run", "start"]
