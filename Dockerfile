FROM nginx:alpine
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf

## Remove default nginx index page

COPY ./dist /usr/share/nginx/html/weboc/
ADD ./scripts/startup /sbin/startup
RUN chmod +x /sbin/startup

EXPOSE 80
ENTRYPOINT ["/sbin/startup"]
