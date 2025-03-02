# Contributing to Mutation Test Action

Thank you for your interest in contributing to the Mutation Test Action! This document provides detailed information about how the project is structured and how you can contribute effectively.

## Project Architecture

The Mutation Test Action is a Node.js-based GitHub Action that runs mutation tests on projects and provides detailed metrics about test quality.

### Directory Structure

```
mutation-test/
├── .github/             # GitHub configurations and workflows
├── __tests__/           # Unit tests
├── dist/                # Compiled code (generated)
├── src/                 # Source code
│   ├── runners/         # Runner implementations
│   ├── services/        # Business services
│   ├── index.ts         # Entry point
│   └── main.ts          # Main logic
├── action.yml           # GitHub Action definition
├── package.json         # Dependencies and scripts
└── rollup.config.js     # Packaging configuration
```

### Execution Flow

1. The entry point of the action is the `src/index.ts` file, which imports and executes the `run()` function from the `src/main.ts` file.
2. The `run()` function configures the Node.js version and initializes the necessary services.
3. The `MutationService` is responsible for running the Stryker Mutator and analyzing the results.
4. The `MutationRunner` coordinates the execution of mutation tests and processes the results.
5. The results are formatted and made available as action output.

## Local Development

### Environment Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/menoncello/mutation-test.git
   cd mutation-test
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Compile the code:
   ```bash
   npm run package
   ```

### Running Tests

```bash
npm run test
```

To run mutation tests on the project itself:

```bash
npm run test:mutation
```

### Testing the Action Locally

You can test the action locally using the `@github/local-action` tool:

```bash
npm run local-action
```

## Contribution Guidelines

### Git Workflow

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR-USERNAME/mutation-test.git`
3. Create a branch for your feature: `git checkout -b feature/feature-name`
4. Make your changes
5. Run tests: `npm run test`
6. Check code style: `npm run lint`
7. Format code: `npm run format:write`
8. Commit your changes: `git commit -m "feat: add new functionality"`
9. Push to your fork: `git push origin feature/feature-name`
10. Open a Pull Request

### Commit Conventions

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Changes that do not affect the meaning of the code (whitespace, formatting, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Code change that improves performance
- `test`: Adding or correcting tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to CI configuration files
- `chore`: Other changes that don't modify src or test files

### Code Standards

- Use TypeScript for all code
- Maintain 100% test coverage
- Follow the code style defined by ESLint and Prettier
- Document all public functions and classes

## Technical Details

### Main Dependencies

- `@actions/core`: GitHub Actions core API
- `@actions/exec`: Shell command execution
- `@stryker-mutator/typescript-checker`: TypeScript type checker for Stryker
- `fs-extra`: File system utilities

### Packaging

The project uses Rollup to package TypeScript code into a single JavaScript file that can be executed by GitHub Actions. The configuration is defined in `rollup.config.js`.

### Tests

Tests are written using Jest and are located in the `__tests__/` directory. The Jest configuration is defined in the `jest.config.js` file.

## Troubleshooting

### Common Errors

1. **ERR_MODULE_NOT_FOUND**: Make sure all necessary dependencies are correctly listed in `dependencies` in `package.json` and that external modules are properly configured in `rollup.config.js`.

2. **Test Failures**: Check if you are using the correct version of Node.js (20+) and if all dependencies are installed.

3. **Packaging Issues**: If packaging fails, check the Rollup configuration and make sure all imports are correct.

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Stryker Mutator Documentation](https://stryker-mutator.io/docs/stryker-js/introduction/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
