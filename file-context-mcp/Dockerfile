FROM node:19-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN mkdir -p storage

# Create resources directory in dist
RUN mkdir -p dist/resources

# Copy YAML file to dist/resources
RUN cp src/resources/file-context-api.yml dist/resources/

RUN npm run build

RUN ls -la dist/

EXPOSE 3001

CMD ["npm", "start"] 