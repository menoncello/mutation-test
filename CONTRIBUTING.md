# Contributing to Mutation Test Action

Thank you for your interest in contributing to the Mutation Test Action! This
document provides guidelines and instructions for contributing to this project.

## Code of Conduct

Please be respectful and considerate of others when contributing to this
project. We are committed to providing a welcoming and inclusive environment for
everyone.

## Getting Started

1. Fork the repository
2. Clone your forked repository
3. Install dependencies with `npm install`
4. Make your changes
5. Run tests to ensure your changes don't break anything: `npm run all`
6. Commit your changes
7. Submit a pull request

## Development Setup

### Prerequisites

- Node.js 20 or later
- npm

### Local Development

1. Clone the repository
2. Run `npm install` to install dependencies
3. Make your changes
4. Run `npm run all` to format, lint, test, and build the action

## Testing

We use Jest for unit testing and Stryker for mutation testing. Please add tests
for any new features or bug fixes.

- Run unit tests: `npm test`
- Run mutation tests: `npm run test:mutation`

## Code Style

We use ESLint and Prettier to enforce code style. Before submitting a PR, please
run:

```bash
npm run format:write
npm run lint
```

## Documentation Requirements

When creating or modifying features, you **must** include appropriate
documentation:

1. Update any relevant documentation files in the `/docs` directory
2. Add JSDoc comments to any new code or modified functions
3. Update the README.md if your changes affect how users interact with the
   action
4. Include examples of how to use new features in your PR description
5. If you're adding new inputs or outputs to the action, update the `action.yml`
   file documentation

Documentation should be clear, concise, and written in English. Remember that
good documentation is as important as good code!

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/)
specification for commit messages. This helps keep the commit history clean and
generates better changelogs.

Examples:

- `feat: add support for TypeScript 5.0`
- `fix: handle edge case in mutation score calculation`
- `docs: update README with new examples`
- `chore: update dependencies`

## Pull Requests

When submitting a pull request:

1. Make sure all tests are passing
2. Update documentation if necessary
3. Add a clear description of the changes
4. Reference any related issues
5. Be responsive to feedback and be prepared to make requested changes

## Feature Requests

If you have a feature request, please open an issue with the "Feature Request"
template and describe the feature you'd like to see, why it would be valuable,
and how it might work.

## Bug Reports

If you find a bug, please open an issue with the "Bug Report" template and
include:

1. A clear description of the bug
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Environment information (OS, Node.js version, etc.)

## License

By contributing to this project, you agree that your contributions will be
licensed under the project's [MIT License](LICENSE).
