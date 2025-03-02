# Quick Start Guide

This guide provides step-by-step instructions to start using the Mutation Test Action in your project.

## Prerequisites

- A project with configured unit tests (Jest, Mocha, etc.)
- A Stryker configuration file (`stryker.conf.js` or `stryker.conf.json`)

## Basic Steps

### 1. Add Stryker to your project

If you don't have Stryker configured yet:

```bash
# Install Stryker
npm install --save-dev @stryker-mutator/core

# Install the runner for your test framework (example for Jest)
npm install --save-dev @stryker-mutator/jest-runner

# Initialize Stryker configuration
npx stryker init
```

### 2. Create a GitHub Actions workflow

Create a `.github/workflows/mutation.yml` file in your repository:

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

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run Mutation Tests
        uses: menoncello/mutation-test@v1
        id: mutation

      - name: Print Mutation Score
        run:
          echo "Mutation Score: ${{ fromJson(steps.mutation.outputs.mutation_metrics).mutationScore }}%"
```

### 3. Customize the configuration (optional)

You can customize the Stryker configuration in the `stryker.conf.js` file:

```javascript
module.exports = {
  packageManager: "npm",
  reporters: ["json", "html", "progress"],
  testRunner: "jest",
  coverageAnalysis: "perTest",
  jest: {
    projectType: "custom",
    configFile: "jest.config.js"
  },
  mutate: [
    "src/**/*.js",
    "!src/**/*.test.js"
  ],
  thresholds: {
    high: 80,
    low: 60,
    break: 50
  }
};
```

### 4. Run the workflow

Push the changes to your repository and the workflow will run automatically.

## Advanced Usage Examples

### Set a minimum mutation score threshold

```yaml
steps:
  - uses: actions/checkout@v4

  - name: Run Mutation Tests
    id: mutation
    uses: menoncello/mutation-test@v1

  - name: Check Mutation Score
    run: |
      SCORE=$(echo '${{ steps.mutation.outputs.mutation_metrics }}' | jq -r '.mutationScore')
      if (( $(echo "$SCORE < 80" | bc -l) )); then
        echo "Mutation score is below 80%: $SCORE%"
        exit 1
      fi
```

### Add mutation score badge to README

1. Create a workflow that generates a badge:

```yaml
steps:
  - uses: actions/checkout@v4
  
  - name: Run Mutation Tests
    id: mutation
    uses: menoncello/mutation-test@v1
    
  - name: Generate Badge
    uses: emibcn/badge-action@v1
    with:
      label: 'mutation score'
      status: ${{ fromJson(steps.mutation.outputs.mutation_metrics).mutationScore }}%
      color: ${{ fromJson(steps.mutation.outputs.mutation_metrics).mutationScore >= 80 && 'green' || fromJson(steps.mutation.outputs.mutation_metrics).mutationScore >= 60 && 'yellow' || 'red' }}
      path: ./mutation-score.svg
      
  - name: Upload Badge
    uses: actions/upload-artifact@v3
    with:
      name: mutation-score-badge
      path: ./mutation-score.svg
```

2. Add the badge to your README:

```markdown
![Mutation Score](https://github.com/username/repo/actions/workflows/mutation.yml/badge.svg)
```

## Troubleshooting

### Mutation tests are too slow

If mutation tests are taking too long:

1. Limit the scope of files to be tested:

```javascript
// stryker.conf.js
module.exports = {
  // ...
  mutate: [
    "src/core/**/*.js",  // Test only the core code
    "!src/**/*.test.js"
  ],
  // ...
};
```

2. Increase parallelism:

```javascript
// stryker.conf.js
module.exports = {
  // ...
  concurrency: 6,  // Adjust based on available resources
  // ...
};
```

### Timeout errors

If you're experiencing timeout errors:

```javascript
// stryker.conf.js
module.exports = {
  // ...
  timeoutMS: 60000,  // Increase timeout to 60 seconds
  // ...
};
```

## Next Steps

- Check the [complete technical documentation](TECHNICAL.md) for more details about the internal workings of the action.
- See the [contribution guide](../CONTRIBUTING.md) if you want to contribute to the project.
- Explore the [Stryker documentation](https://stryker-mutator.io/docs/stryker-js/introduction/) to learn more about mutation testing.
