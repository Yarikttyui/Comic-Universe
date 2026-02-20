FROM thyrlian/android-sdk:latest AS builder

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

RUN npm install -g cordova

WORKDIR /app

RUN cordova create comicapp com.comicuniverse.app "Comic Universe"

WORKDIR /app/comicapp

RUN cordova platform add android

COPY webdir/ ./www/

RUN cordova build android --debug || echo "Build attempted"

FROM alpine:3.18
COPY --from=builder /app/comicapp/platforms/android/app/build/outputs/apk/debug/ /output/
