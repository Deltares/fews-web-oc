FROM nginx

COPY weboc.zip /tmp
RUN apt-get update -y && apt-get install -y unzip
RUN mkdir /app
RUN unzip /tmp/weboc.zip -d /app
COPY app-config.json /app/
COPY nginx.conf /etc/nginx/nginx.conf