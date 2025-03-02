/**
 * Example configuration of Stryker Mutator for use with Mutation Test Action
 *
 * This file serves as an example of how to configure Stryker Mutator
 * for use with Mutation Test Action. You can copy this file to
 * your project and adjust it as needed.
 */
module.exports = {
  // Package manager to be used
  packageManager: 'npm',

  // Reporters to generate output in different formats
  reporters: [
    'html', // Generates a detailed HTML report
    'json', // Generates a JSON report (required for Mutation Test Action)
    'progress', // Shows progress in the console
    'clear-text' // Shows a summary in the console
  ],

  // Test framework to be used
  testRunner: 'jest',

  // How to analyze code coverage
  coverageAnalysis: 'perTest',

  // Jest-specific configuration
  jest: {
    // Project type (custom, create-react-app, etc.)
    projectType: 'custom',
    // Path to Jest configuration file
    configFile: 'jest.config.js'
  },

  // Files to be mutated
  mutate: [
    'src/**/*.ts', // Include all TypeScript files in src
    '!src/**/*.test.ts', // Exclude test files
    '!src/**/*.spec.ts', // Exclude test files
    '!src/types/**/*.ts' // Exclude type files
  ],

  // Thresholds for mutation score classification
  thresholds: {
    high: 80, // Score above 80% is considered high
    low: 60, // Score below 60% is considered low
    break: 50 // Fails if the score is less than 50%
  },

  // Maximum number of parallel processes
  concurrency: 4,

  // Timeout in milliseconds for each test
  timeoutMS: 30000,

  // Plugins to be loaded
  plugins: [
    '@stryker-mutator/typescript-checker', // Checks if mutations are valid in TypeScript
    '@stryker-mutator/jest-runner' // Runner for Jest
  ],

  // TypeScript-specific configuration
  tsconfigFile: 'tsconfig.json',

  // Ignore file patterns (in addition to those specified in mutate)
  ignorePatterns: ['node_modules', 'dist', 'coverage'],

  // Configuration of specific mutators
  mutator: {
    // Which mutators to use
    plugins: [
      'typescript' // Use TypeScript-specific mutators
    ],
    // Exclude specific mutators
    excludedMutations: [
      // "StringLiteral" // Example: do not mutate string literals
    ]
  }
}
