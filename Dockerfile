FROM node:13-alpine AS builder

COPY ./ /home/node
WORKDIR /home/node

RUN yarn install && \
   yarn --cwd=backend-server build


FROM node:13-alpine AS production

COPY --from=builder /home/node/backend-server/dist /home/node/app/dist
COPY --from=builder /home/node/backend-server/node_modules /home/node/app/node_modules
COPY --from=builder /home/node/node_modules /home/node/node_modules
WORKDIR /home/node/app

RUN apk update \
    && apk add --no-cache \
        python3 \
        libc6-compat \
    && ln -s /lib/libc.musl-x86_64.so.1 /lib/ld-linux-x86-64.so.2 \
    && pip3 install --upgrade pip

ENV PORT 8080
EXPOSE 8080
ENV NODE_ENV production

CMD node dist/index.js

