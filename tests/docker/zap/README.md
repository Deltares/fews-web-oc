# Configure the web service to be used by the web oc. On teamcity we do something similar like this:

cat > tests/docker/zap/weboc-nginx/app-config.json <<EOL
{
"VUE_APP_FEWS_WEBSERVICES_URL": "my webservice url",
"VUE_APP_MAPBOX_TOKEN": "my token"
}
EOL

# Copy the latest weboc build to the ngnix build directory and build the nginx image with the weboc (we may also use a volume mount instead).

docker compose --project-directory . build

# Create a network to allow the zap scanner to connect to the weboc container.
docker network create zapnet
# Run the weboc detached.
docker run -d --net zapnet --name weboc-nginx -t deltares/delft-fews/weboc-nginx:latest
# Run the scanner until completion.
docker run --name weboc-zap --net zapnet -v c:/temp/zap:/zap/wrk/:rw -t owasp/zap2docker-stable zap-full-scan.py -t http://weboc-nginx -g gen.conf -r report.html -x report.xml -J report.json

# When doen, the report is in the zap directory

docker stop weboc-zap
docker rm weboc-zap
docker stop weboc-nginx
docker rm weboc-nginx
docker image rm  deltares/delft-fews/weboc-nginx
