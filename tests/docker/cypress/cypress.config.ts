import { defineConfig } from "cypress";

export default defineConfig({

  reporter: 'junit',
  reporterOptions: {
    mochaFile: 'cypress/report/junit-[hash].xml',
    toConsole: true,
  },
  e2e: {
    baseUrl: 'http://nginx-weboc/',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
