# Mutation Test Action

[![Continuous Integration](https://github.com/menoncello/mutation-test/actions/workflows/ci.yml/badge.svg)](https://github.com/menoncello/mutation-test/actions/workflows/ci.yml)

A GitHub Action that runs mutation tests on your code and ensures that the mutation score meets defined quality standards.

## Documentation

- [Quick Start Guide](docs/QUICK-START.md)
- [Mutation Testing Concepts](docs/MUTATION-TESTING-CONCEPTS.md)
- [Technical Documentation](docs/TECHNICAL.md)
- [Contributing Guide](CONTRIBUTING.md)

## What is Mutation Testing?

Mutation testing is a software testing technique that evaluates the quality of your tests by introducing small changes (mutations) to the source code and checking if existing tests detect these changes. This helps identify parts of the code that are not being adequately tested.

Some examples of mutations include:
- Replacing arithmetic operators (`+` with `-`, `*` with `/`, etc.)
- Modifying comparison operators (`>` with `>=`, `==` with `!=`, etc.)
- Removing statements
- Changing boolean values (`true` with `false`)

## How this Action works

1. The action runs Stryker Mutator on your code
2. Analyzes the mutation test results
3. Checks if the mutation score meets the configured threshold
4. Provides detailed metrics as action output

## Usage

### Basic Configuration

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
        uses: menoncello/mutation-test@v1
        with:
          node-version: '20'
```

### Inputs

| Name | Description | Required | Default |
|------|-------------|----------|--------|
| `node-version` | Node.js version to use for running mutation tests | No | `20` |

### Outputs

| Name | Description |
|------|-------------|
| `mutation_metrics` | JSON object containing detailed mutation test metrics, including score, killed/survived mutants, and test coverage |

## Examples

### Check Minimum Mutation Score

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

### Publish Results as PR Comment

```yaml
steps:
  - uses: actions/checkout@v4
  
  - name: Run Mutation Tests
    id: mutation
    uses: menoncello/mutation-test@v1
    
  - name: Comment on PR
    uses: actions/github-script@v6
    if: github.event_name == 'pull_request'
    with:
      github-token: ${{ secrets.GITHUB_TOKEN }}
      script: |
        const metrics = JSON.parse('${{ steps.mutation.outputs.mutation_metrics }}');
        const comment = `## Mutation Test Results
        - Score: ${metrics.mutationScore}%
        - Killed: ${metrics.killed}
        - Survived: ${metrics.survived}
        - Total: ${metrics.total}`;
        
        github.rest.issues.createComment({
          issue_number: context.issue.number,
          owner: context.repo.owner,
          repo: context.repo.repo,
          body: comment
        })
```

## Development

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
git clone https://github.com/menoncello/mutation-test.git
cd mutation-test
npm install
```

### Available Scripts

- `npm run test` - Run tests
- `npm run lint` - Check code with ESLint
- `npm run format:write` - Format code with Prettier
- `npm run package` - Compile TypeScript code and create the package
- `npm run all` - Run all checks (format, lint, test, package)

### Testing Locally

You can test this action locally using the @github/local-action tool:

```bash
npm run local-action
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
