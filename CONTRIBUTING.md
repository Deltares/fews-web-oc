# The Delft-FEWS Web OC Developers Documentation

## Definition Of Done

Before merging a feature into the main branch, the following requirements have to be met:

- All feature branches have to be reviewed and merged by another developer than the feature developer.
- All unit tests and e2e tests have to succeed: npm run test:unit and test:e2e.
- No lint errors are allowed: npm run lint
- Sonarqube (https://sonarqube.deltares.nl/projects/) reports all A's.
- Code coverage of libraries at least 80%.
- Typescript types have to be used from the libraries.
- Reusable vue components to web components.
- Documentation up to date
