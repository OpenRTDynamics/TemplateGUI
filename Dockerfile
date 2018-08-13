FROM node:8

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY . .

#ADD ./bin/ortdrun /usr/local/bin

RUN git clone https://github.com/OpenRTDynamics/ORTD.git
RUN echo LINUX > ORTD/target.conf
RUN make -C ORTD config
RUN make -C ORTD
#RUN make -C ORTD install
RUN cp ORTD/bin/ortdrun_static /usr/local/bin/ortdrun


EXPOSE 8091
CMD [ "npm", "start" ]