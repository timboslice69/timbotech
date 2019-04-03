# Timbo Tech
# Version: 1.0
FROM node:10

# Setup Project
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Setup Packages
COPY ./package.json /usr/src/app/
RUN npm install && npm cache clean --force

#Copy Source Code
COPY . /usr/src/app

#server
ENV NODE_ENV production
ENV PORT 80
EXPOSE 80
CMD [ "npm", "run", "start" ]