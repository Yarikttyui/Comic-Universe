FROM electronuserland/builder:wine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install --legacy-peer-deps

COPY . .

RUN npx electron-builder --win portable --x64 --config.win.signAndEditExecutable=false

FROM alpine:3.20
WORKDIR /output
COPY --from=builder /app/release/ ./
CMD ["sh", "-c", "ls -la /output"]
