# Builder stage: build and install dependencies
FROM mysten/sui-tools:mainnet

RUN sui client -y

# Install curl and Node.js in builder stage only
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g npm@latest

WORKDIR /app

COPY package*.json ./

# Install all dependencies (including dev)
RUN npm install

COPY . .

EXPOSE 8080

CMD ["node", "app.js"]
