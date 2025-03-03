# Technical Documentation

This document provides technical details about how the Mutation Test Action
works internally, which is useful for contributors and developers who want to
customize the action.

## Architecture

The Mutation Test Action is built using TypeScript and follows a modular
architecture with the following key components:

### Main Components

1. **Main Entry Point (`src/main.ts`)**

   - Sets up the environment
   - Orchestrates the execution flow
   - Handles error reporting to GitHub Actions

2. **MutationService (`src/services/mutation-service.ts`)**

   - Reads and writes mutation metrics
   - Interfaces with the mutation testing framework (Stryker)
   - Manages mutation test result data

3. **MutationRunner (`src/runners/mutation-runner.ts`)**

   - Controls the execution of mutation tests
   - Validates and compares mutation scores
   - Reports detailed metrics to GitHub Actions

4. **Types (`src/types/mutation.ts`)**
   - Defines the data structures used throughout the application

## Execution Flow

1. When the action is triggered, `main.ts` is executed
2. Node.js version is set up based on input parameters
3. A `MutationService` instance is created
4. A `MutationRunner` instance is created and initialized with the service
5. `MutationRunner.run()` is called to execute the mutation tests

### Detailed Flow in MutationRunner

```
MutationRunner.run()
  ├── Read previous mutation metrics
  ├── Validate metrics
  ├── Log old mutation score
  ├── Run mutation tests
  ├── Get new mutation metrics
  ├── Validate new metrics
  ├── Compare old and new scores
  ├── Log detailed metrics
  └── Save new metrics for future runs
```

## Key Features Implementation

### Reading Previous Metrics

The `MutationService.readMutationMetrics()` method reads previous metrics from
the `mutation-metrics.json` file. If the file doesn't exist or is invalid, it
returns default metrics with a score of 0.

```typescript
async readMutationMetrics(): Promise<MutationMetrics> {
  try {
    if (!fs.existsSync(this.metricsFile)) {
      return this.getDefaultMetrics();
    }
    const metrics = await fs.readJson(this.metricsFile);
    return metrics as MutationMetrics;
  } catch (error) {
    const errorMessage = (error as Error).message;
    core.warning(
      `Could not read previous mutation metrics. Using default baseline. ${errorMessage}`
    );
    return this.getDefaultMetrics();
  }
}
```

### Running Mutation Tests

The `MutationRunner.runMutationTests()` method executes the mutation tests using
the npm script `test:mutation`, which runs Stryker Mutator:

```typescript
private runMutationTests(): void {
  core.info('Running mutation tests...');
  try {
    execSync('npm run test:mutation', { stdio: 'inherit' });
  } catch (error) {
    const errorMsg = `Test execution failed: ${error instanceof Error ? error.message : 'unknown error'}`;
    core.setFailed(errorMsg);
    throw new Error(errorMsg);
  }
}
```

### Score Comparison

The `MutationRunner.compareScores()` method compares the old and new mutation
scores. If the new score is lower than the old one, it fails the build:

```typescript
private compareScores(oldScore: number, newScore: number): void {
  if (newScore < oldScore) {
    throw new Error(
      `Tests failed: mutation score has decreased from ${oldScore} to ${newScore}`
    );
  }
  const improvement = newScore - oldScore;
  if (improvement > 10) {
    core.info(
      `Significant improvement in mutation score: +${improvement.toFixed(2)} points!`
    );
  }
}
```

## Customization Points

### Stryker Configuration

The action relies on the project's `stryker.config.json` file for configuring
mutation testing. This file can be customized to change:

- Mutation operators
- Test runner settings
- Files to include/exclude
- Reporting options

### Node.js Version

The action supports customizing the Node.js version through the `node-version`
input parameter, which is managed by the `setupNodeVersion()` function in
`main.ts`.

## Performance Considerations

- Mutation testing is computationally intensive and may take significant time on
  large codebases
- The action stores metrics in JSON format to enable efficient comparison
  between runs
- Only minimal data is logged to the GitHub Actions console to avoid cluttering

## Error Handling

The action employs a comprehensive error handling strategy:

1. Each major operation is wrapped in try/catch blocks
2. Errors are reported to GitHub Actions using `core.setFailed()`
3. Warning messages for non-fatal issues use `core.warning()`
4. Informational messages use `core.info()`
5. Detailed debug information uses `core.debug()`

## Future Enhancements

Potential areas for improvement include:

1. Support for more configuration options via action inputs
2. Integration with more mutation testing frameworks beyond Stryker
3. Enhanced reporting capabilities (HTML reports, GitHub PR comments)
4. Support for custom thresholds and quality gates
