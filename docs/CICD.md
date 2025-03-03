# CI/CD Workflows Documentation

This document details the Continuous Integration and Continuous Deployment
workflows implemented for the Mutation Test Action project.

## Overview

The project uses GitHub Actions to automate testing, validation, and deployment
processes. Two main workflows are configured:

1. **Continuous Integration (CI)** - Runs on pull request creation and updates
2. **Deployment** - Runs when pull requests are merged

## Continuous Integration Workflow

File: `.github/workflows/ci.yaml`

This workflow triggers when pull requests are opened, synchronized, reopened, or
closed against the `main`, `develop`, or `release/**` branches.

### Jobs

#### 1. TypeScript Tests

Validates the TypeScript code:

- Sets up Node.js using the version specified in `.node-version`
- Caches npm dependencies
- Performs format checking with Prettier
- Lints code with ESLint
- Runs unit tests
- Runs mutation tests

#### 2. GitHub Actions Test

Tests the action itself:

- Uses the local action with Node.js version 20
- Prints the mutation metrics output

#### 3. Lint Codebase

Performs comprehensive linting using Super-Linter:

- Uses a slim version of Super-Linter
- Validates multiple file types
- Excludes the `dist/` directory

#### 4. Check dist/

Validates the distribution files:

- Builds the dist/ directory
- Ensures the build output matches what's committed
- Fails if there are uncommitted changes

## Deployment Workflow

File: `.github/workflows/deploy.yaml`

This workflow triggers when pull requests are closed (merged) against the
`main`, `develop`, or `release/**` branches.

### Jobs

#### 1. TypeScript Tests

Identical to the CI workflow's TypeScript tests job.

#### 2. Lint Codebase

Identical to the CI workflow's Lint Codebase job.

#### 3. Check dist/

Similar to the CI workflow's Check dist/ job, but runs after the Lint and
TypeScript Tests jobs have completed successfully.

#### 4. Mutation Test

Runs the mutation test action:

- Uses the local action with Node.js version 20
- Outputs the mutation metrics
- Uploads mutation reports as artifacts:
  - `mutation-report.html`
  - `mutation-report.json`
  - `mutation-metrics.json`

#### 5. Bump Version

Automatically increments the version number:

- Configures Git user
- Determines the next version number
- Updates the version in package.json
- Updates mutation metrics
- Creates a commit with the version change
- Tags the release
- Pushes changes to the repository

#### 6. Deploy

Creates and uploads the distribution artifacts:

- Checks out the code
- Sets up Node.js
- Builds the dist/ directory
- Uploads the dist/ directory as an artifact

## Workflow Outputs

The deployment workflow produces several outputs:

- **dist/** - The bundled JavaScript files for the action
- **mutation-report.html** - HTML report of mutation test results
- **mutation-report.json** - JSON format of the mutation test results
- **mutation-metrics.json** - Metrics from the mutation tests

## Customizing Workflows

To customize these workflows:

1. Edit the appropriate workflow file (`.github/workflows/ci.yaml` or
   `.github/workflows/deploy.yaml`)
2. Modify the triggers, jobs, or steps as needed
3. Commit and push the changes

## Troubleshooting

Common issues and their solutions:

### Failed TypeScript Tests

- Check the test output logs
- Ensure all tests have appropriate assertions
- Verify that mutation testing configuration is correct

### Version Bumping Issues

- Check Git credentials and permissions
- Ensure the repository has appropriate write access

### Artifact Upload Failures

- Check file paths in the workflow
- Verify that files exist before attempting upload
- Check GitHub Actions logs for specific error messages
