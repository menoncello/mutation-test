import { execSync } from 'child_process'
import * as core from '@actions/core'
import { MutationRunner } from '../../src/runners/mutation-runner'
import { MutationService } from '../../src/services/mutation-service'
import { MutationMetrics } from '../../src/types/mutation'

// Setup mocks
jest.mock('@actions/core')
jest.mock('child_process')
jest.mock('../../src/services/mutation-service')

export const mockedCore = jest.mocked(core)
export const mockedExecSync = jest.mocked(execSync)

// Default test metrics
export const defaultOldMetrics: MutationMetrics = {
  score: 80,
  killed: 80,
  survived: 15,
  timeout: 2,
  noCoverage: 3,
  mutants: {
    total: 100,
    mutated: ['src/file1.ts']
  },
  testFiles: ['test1.ts'],
  timestamp: '2025-02-23T11:00:00Z'
}

export const defaultNewMetrics: MutationMetrics = {
  score: 85,
  killed: 90,
  survived: 10,
  timeout: 2,
  noCoverage: 3,
  mutants: {
    total: 105,
    mutated: ['src/file1.ts', 'src/file2.ts']
  },
  testFiles: ['test1.ts', 'test2.ts'],
  timestamp: '2025-02-23T12:00:00Z'
}

// Setup function to create a mock mutation service
export function createMockMutationService(): jest.Mocked<MutationService> {
  return {
    readMutationMetrics: jest.fn(),
    getMutationMetrics: jest.fn(),
    saveMetrics: jest.fn()
  } as any
}

// Setup function to create a MutationRunner instance with mocked dependencies
export function createMutationRunner(
  mutationService?: jest.Mocked<MutationService>
): {
  runner: MutationRunner
  mutationService: jest.Mocked<MutationService>
} {
  const service = mutationService || createMockMutationService()
  const runner = new MutationRunner(service)

  return {
    runner,
    mutationService: service
  }
}

// Helper to setup default test conditions
export function setupDefaultTestConditions(
  mutationService: jest.Mocked<MutationService>,
  oldMetrics = defaultOldMetrics,
  newMetrics = defaultNewMetrics
): void {
  mutationService.readMutationMetrics.mockResolvedValue(oldMetrics)
  mutationService.getMutationMetrics.mockResolvedValue(newMetrics)
  mutationService.saveMetrics.mockResolvedValue()
  mockedExecSync.mockReturnValue(Buffer.from(''))
}

// Reset all mocks between tests
export function resetMocks(): void {
  jest.clearAllMocks()
}
