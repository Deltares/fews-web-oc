
# Developer documentation

This project is created using the Vite project template for Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Type Support For `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

If the standalone TypeScript plugin doesn't feel fast enough to you, Volar has also implemented a [Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669) that is more performant. You can enable it by the following steps:

1. Disable the built-in TypeScript Extension
   1. Run `Extensions: Show Built-in Extensions` from VSCode's command palette
   2. Find `TypeScript and JavaScript Language Features`, right click and select `Disable (Workspace)`
2. Reload the VSCode window by running `Developer: Reload Window` from the command palette.

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