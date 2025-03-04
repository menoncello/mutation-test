# Action Configuration Reference

This document provides detailed information about configuring the Mutation Test
Action in your GitHub workflows.

## action.yaml

The `action.yaml` file defines the inputs, outputs, and runtime configuration
for the GitHub Action.

### Name and Description

```yaml
name: Mutation Test
description:
  Automatically runs mutation tests on your codebase and ensures the mutation
  score meets quality standards.
author: Eduardo Menoncello
```

These fields define how your action appears in the GitHub Marketplace and Action
listings.

### Branding

```yaml
branding:
  icon: 'shield'
  color: 'green'
```

The branding section determines the icon and color displayed in the GitHub
Marketplace.

Available icons:
[GitHub Actions Icons](https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions#brandingicon)

Available colors: white, yellow, blue, green, orange, red, purple, or gray.

### Inputs

```yaml
inputs:
  node-version:
    description: Version of Node.js to use for running the mutation tests
    required: false
    default: '20'
```

#### Available Inputs

| Input          | Description                                           | Required | Default |
|----------------|-------------------------------------------------------|----------|---------|
| `node-version` | Node.js version to use for running the mutation tests | No       | '20'    |

### Outputs

```yaml
outputs:
  mutation_metrics:
    description:
      JSON object containing detailed mutation test metrics including score,
      killed/survived mutants, and test coverage
```

#### Available Outputs

| Output             | Description                                      |
|--------------------|--------------------------------------------------|
| `mutation_metrics` | JSON object containing detailed mutation metrics |

### Runtime Configuration

```yaml
runs:
  using: node20
  main: dist/index.js
```

This section specifies that the action runs using Node.js 20 and the entry point
is `dist/index.js`.

## Using the Action in Your Workflow

### Basic Example

```yaml
name: Mutation Testing

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  mutation-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Mutation Tests
        uses: menoncello/mutation-test-action@v0
        with:
          node-version: '20' # Optional, defaults to '20'
```

### Advanced Example with Result Processing

```yaml
name: Mutation Testing

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  mutation-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Fetch all history for better mutation analysis

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Run Mutation Tests
        id: mutation
        uses: menoncello/mutation-test-action@v0

      - name: Upload Mutation Report
        uses: actions/upload-artifact@v3
        with:
          name: mutation-report
          path: mutation-metrics.json

      # Example of using the output
      - name: Check Mutation Score
        run: |
          echo "Mutation Score: $(cat mutation.txt)"
```

## Customizing Stryker Configuration

This action uses Stryker Mutator for mutation testing. You can customize how
Stryker runs by modifying your `stryker.config.json` file.

For full documentation on Stryker configuration options, see the
[Stryker Documentation](https://stryker-mutator.io/docs/stryker-js/configuration/).
