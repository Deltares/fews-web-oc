# Cypress E2E tests.


# Configure the web service to be used by the web oc. The weboc is in the dist folder that was created in the previous step.

cat > dist/app-config.json <<EOL
{
"VUE_APP_FEWS_WEBSERVICES_URL": "my webservice url",
"VUE_APP_MAPBOX_TOKEN": "my token"
}
EOL

# Remove all containers:

docker rm cypress
docker rm nginx-weboc

cd tests/docker/cypress

# Start the web oc in the background.
docker compose up nginx-weboc -d
# Run the cypress e2e tests.
docker compose up cypress

docker compose stop
docker rm cypress
docker rm nginx-weboc