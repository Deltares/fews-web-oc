
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



## Build variants

The default commands (`npm run dev`, `npm run build`, and `npm run preview`)
retain Module Federation support.

For a standalone application without Module Federation:

```sh
npm run dev:standalone
npm run build:standalone
npm run preview:standalone
```

The standalone build writes to `dist-standalone`, leaving the federated output
in `dist` untouched. It uses a separate Vite configuration that does not import
or install the federation plugin. A build guard rejects federation package
imports and generated federation modules, including transitive imports.
Federation dependencies remain installed for the default build.

Both variants share the same Vue, Vuetify, proxy, CSP, entry point, and dependency
optimization settings. Vite arguments can be passed through as usual:

```sh
npm run build:standalone -- --base=/weboc/ --mode e2e
```

The standalone build never fetches a federation manifest, registers remotes, or
requests microfrontend configuration. If `VITE_FEWS_WEBOC_MF_MANIFEST_URL` is
configured, startup logs a warning and ignores it. Microfrontend-only topology
nodes, display tabs, and remote status panels are hidden; opening a microfrontend
display URL shows an explicit unsupported-feature error. Other displays and
authentication remain available.

Application code imports `@weboc/module-federation`, which Vite resolves to the
appropriate adapter. Keep all federation package imports in the federated
adapter or the default Vite configuration, not shared application code.
The component-test configuration uses the standalone adapter.

Targeted adapter and exclusion tests:

```sh
npm run test:unit -- tests/unit/lib/moduleFederation.standalone.test.ts tests/unit/lib/moduleFederation.federated.test.ts tests/unit/lib/moduleFederation.build.test.ts
npm run test:unit -- --config vite.config.standalone.ts tests/unit/lib/moduleFederation.standalone.test.ts tests/unit/lib/moduleFederation.build.test.ts
```

The federated adapter test intentionally imports the federation runtime and
therefore runs only with the default configuration, not the standalone guard.

### Release artifacts

Publishing a GitHub release builds both variants for both deployment paths:

| Release asset                                     | Base path | Module Federation |
| ------------------------------------------------- | --------- | ----------------- |
| `deltares-fews-weboc-<tag>.zip`                     | `/`       | Enabled           |
| `deltares-fews-weboc-weboc-<tag>.zip`               | `/weboc/` | Enabled           |
| `deltares-fews-weboc-standalone-<tag>.zip`           | `/`       | Disabled          |
| `deltares-fews-weboc-weboc-standalone-<tag>.zip`     | `/weboc/` | Disabled          |

Archive names include the `deltares` prefix, package name, and published release
tag, for example `deltares-fews-weboc-v1.5.1.zip`. The `weboc` suffix identifies
the `/weboc/` base path.

Each archive contains a `dist/` directory for consistent deployment across
variants. The release workflow overrides the standalone output directory only
for packaging; local standalone builds still write to `dist-standalone`.
Archives are uploaded as workflow artifacts using `actions/upload-artifact`
and attached to the published release using `gh release upload`.
Rerunning the workflow replaces release assets with matching names.

## E2E testing

For end-to-end testing we use [Playwright](https://playwright.dev/).

To run end-to-end tests, you have two options:

**Option 1: Build and test with preview server (default)**

```
npm run build:e2e
npm run test:e2e
```

`npm run test:e2e` will automatically start a preview server, or reuse an existing preview or dev server if one is already running.

**Option 2: Use the dev server**

```
npm run dev:e2e
npm run test:e2e
```

If the dev server is running, `npm run test:e2e` will reuse it automatically.

> [!WARNING]
> The dev server might time out for certain tests.

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
