# Publish npm packages with lerna and NPM

To build a new release of one of the npm packages, follow the following steps. Either use lerna or npm, depending on the package.

For the SSD Requests library use:

    lerna version prerelease (will create a tag a push a tag automatically)

for the other libraries use:

    npm version 0.2.7.alpha.0
    git push origin v0.2.7.alpha.0
    git push

The following steps are performed with git:

Update the version in package.json and create a tag:

    npm version 0.5.17-alpha.0

Push the tag (N.B. the tag is prefixed with a v)

    git push origin v0.5.17-alpha.0

Push the commit

    git push

GitHub steps:

Create a new release in GitHub: v0.2.7.alpha.0 and chose the correct tag. A GitHub action will test this release and deploy to NPM if successful.

If the release was build successfully, test with this release in the web oc.

If the tests are successful, create a final release
