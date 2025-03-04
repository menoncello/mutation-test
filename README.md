# Mutation Test Action

[![CI](https://github.com/menoncello/mutation-test/actions/workflows/ci.yaml/badge.svg)](https://github.com/menoncello/mutation-test/actions/workflows/ci.yaml)
[![Deploy](https://github.com/menoncello/mutation-test/actions/workflows/deploy.yaml/badge.svg)](https://github.com/menoncello/mutation-test/actions/workflows/deploy.yaml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)
[![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fmenoncello%2Fauth-endpoint%2Fmain)](https://dashboard.stryker-mutator.io/reports/github.com/menoncello/auth-endpoint/main)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/fcf2b37a6895446a9d6e83cf83b058c3)](https://app.codacy.com/gh/menoncello/mutation-test/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)

A GitHub Action to enforce mutation testing quality in your CI/CD pipeline.

## Overview

Mutation Test Action runs mutation testing on your codebase and ensures that
your mutation score doesn't decrease over time. This helps maintain and improve
the quality of your test suite by identifying areas where your tests fail to
detect potential bugs.

## What is Mutation Testing?

Mutation testing is a technique used to evaluate the effectiveness of your test
suite. It works by introducing small changes (mutations) to your source code and
then running your tests against these mutated versions. If your tests fail when
run against a mutation, that mutation is "killed". The percentage of killed
mutations out of the total mutations generated is your mutation score.

A high mutation score indicates that your tests are effective at detecting
potential bugs, while a low score suggests that your test suite might miss
certain issues.

## Features

- Runs mutation tests using Stryker Mutator
- Tracks mutation score over time
- Fails the build if the mutation score decreases
- Provides detailed metrics on mutation test results
- Configurable Node.js version support
- Automated CI/CD workflows with version bumping and artifact creation

## Installation

Add this action to your GitHub workflow:

```yaml
name: Mutation Testing

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  mutation-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Mutation Tests
        uses: your-username/mutation-test-action@v1
        with:
          node-version: '20' # Optional, defaults to '20'
```

## Inputs

| Input          | Description            | Required | Default |
| -------------- | ---------------------- | -------- | ------- |
| `node-version` | Node.js version to use | No       | '20'    |

## Outputs

The action creates the following files:

- `mutation-metrics.json`: Detailed mutation testing metrics in JSON format
- `mutation.txt`: The current mutation score

## How It Works

1. The action first reads any existing mutation metrics from previous runs
2. It runs mutation tests using Stryker Mutator via `npm run test:mutation`
3. It collects new metrics from the test run
4. It compares the new score with the previous score
5. If the new score is lower than the previous score, the action fails
6. It saves the new metrics for future comparison

## Metrics Tracked

- Overall mutation score
- Number of killed mutants
- Number of survived mutants
- Number of timeout mutants
- Number of mutants with no coverage
- Total number of mutants
- List of mutated files
- Timestamp of the test run

## CI/CD Workflows

This project includes comprehensive CI/CD workflows:

### Continuous Integration (PR Validation)

When a PR is opened or updated, the CI workflow automatically:

- Runs TypeScript tests and mutation tests
- Performs code linting
- Validates the bundled distribution files
- Checks if the action works correctly

### Deployment (PR Merge)

When a PR is merged, the deployment workflow automatically:

- Validates code quality with tests and linting
- Runs mutation tests and generates reports
- Bumps version numbers based on commit history
- Updates mutation metrics
- Creates a new versioned release
- Deploys the bundled files as artifacts

For detailed information about the workflows, see
[CI/CD Documentation](./docs/CICD.md).

## Development

### Prerequisites

- Node.js 20 or later
- npm

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Available Scripts

- `npm run test`: Run tests
- `npm run test:mutation`: Run mutation tests with Stryker
- `npm run format:write`: Format code using Prettier
- `npm run lint`: Lint code with ESLint
- `npm run package`: Bundle the action for distribution
- `npm run all`: Run format, lint, test, coverage, and package
- `npm run local-action`: Test the action locally

### Testing the Action Locally

You can test the action locally using the `@github/local-action` package:

```bash
npm run local-action
```

## License

MIT
