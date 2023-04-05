## Creating a release

Before creating a release make sure that all changes are merged to the main branch.

1. Update the version number to X.Y.Z

npm:
```
git checkout main
git pull
npm version X.Y.Z
```
The last command updates the version in `package.json` and `package-lock.json` and creates a git tag `vX.Y.Z`

lerna:
```
git checkout main
git pull
lerna version prerelease
    or
lerna version release
```
The last command updates all packages with the version in `package.json` and `package-lock.json` and creates a git tag `vX.Y.Z`

2. Push the changes to GitHub

```
git push
git push origin vX.Y.Z
```

3. Create a release on GitHub

Creating a release on GitHub is a manual step. For more information see: https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository
Create the release from the existing tag we just created. For the title of the release use `vX.Y.Z`. Use the `Generate releasenotes` button to list all pull request that are included in this release. When the release is created the Github workflow '.github/workflows/npm-publish' will run automatically to deploy the new version to https://www.npmjs.com/package/@deltares/fews-....