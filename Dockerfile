FROM mcr.microsoft.com/playwright:focal

RUN apt-get update && apt-get install -y \
    libgbm-dev \
    libgtk-3-0 \
    libnotify-dev \
    libgconf-2-4 \
    libnss3 \
    libxss1 \
    libasound2 \
    xvfb \
    libnspr4 \
    libgbm1

WORKDIR /app

COPY . .

RUN npm install

RUN npx playwright install

EXPOSE 3000

CMD ["npm", "start"]