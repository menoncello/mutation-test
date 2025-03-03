import { execSync } from 'child_process'
import * as core from '@actions/core'
import { MutationRunner } from '../../src/runners/mutation-runner'
import { MutationService } from '../../src/services/mutation-service'
import { MutationMetrics } from '../../src/types/mutation'

jest.mock('@actions/core')
jest.mock('child_process')
jest.mock('../../src/services/mutation-service')

const mockedCore = jest.mocked(core)
const mockedExecSync = jest.mocked(execSync)

describe('MutationRunner - Command Execution', () => {
  let runner: MutationRunner
  let mutationService: jest.Mocked<MutationService>

  const defaultOldMetrics: MutationMetrics = {
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

  const defaultNewMetrics: MutationMetrics = {
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

  beforeEach(() => {
    jest.clearAllMocks()

    mutationService = {
      readMutationMetrics: jest.fn(),
      getMutationMetrics: jest.fn(),
      saveMetrics: jest.fn()
    } as any

    runner = new MutationRunner(mutationService)
  })

  it('should execute mutation test command with correct parameters', async () => {
    // Setup test data
    mutationService.readMutationMetrics.mockResolvedValue(defaultOldMetrics)
    mutationService.getMutationMetrics.mockResolvedValue(defaultNewMetrics)
    mutationService.saveMetrics.mockResolvedValue()

    // Run the test
    await runner.run()

    // Verify execSync was called with correct command and options
    expect(mockedExecSync).toHaveBeenCalledWith(
      'npm run test:mutation',
      expect.objectContaining({
        stdio: 'inherit'
      })
    )
  })

  it('should throw error with correct message when command fails', async () => {
    // Setup test data
    mutationService.readMutationMetrics.mockResolvedValue(defaultOldMetrics)
    const commandError = new Error('Command failed')
    mockedExecSync.mockImplementation(() => {
      throw commandError
    })

    // Run and verify
    await expect(runner.run()).rejects.toThrow(
      'Test execution failed: Command failed'
    )
    expect(mockedExecSync).toHaveBeenCalledWith(
      'npm run test:mutation',
      expect.objectContaining({
        stdio: 'inherit'
      })
    )
    expect(core.setFailed).toHaveBeenCalledWith(
      'Test execution failed: Command failed'
    )
  })

  it('should handle non-Error objects thrown by execSync', async () => {
    // Setup test data
    mutationService.readMutationMetrics.mockResolvedValue(defaultOldMetrics)
    mockedExecSync.mockImplementation(() => {
      throw 'String error'
    })

    // Run and verify
    await expect(runner.run()).rejects.toThrow(
      'Test execution failed: unknown error'
    )
    expect(core.setFailed).toHaveBeenCalledWith(
      'Test execution failed: unknown error'
    )
  })

  it('should handle stryker not found error with helpful message', async () => {
    // Setup test data
    mutationService.readMutationMetrics.mockResolvedValue(defaultOldMetrics)
    mockedExecSync.mockImplementation(() => {
      throw new Error('stryker: not found')
    })

    // Run and verify
    await expect(runner.run()).rejects.toThrow('Stryker command not found')

    // Verify the exact error message content
    const expectedDetailedError =
      'Stryker command not found. This usually happens when Stryker is not installed. ' +
      'The action will attempt to install it automatically, but if this error persists, ' +
      'please ensure @stryker-mutator/core is installed either globally or as a dev dependency.'

    expect(mockedCore.setFailed).toHaveBeenCalledWith(expectedDetailedError)
  })

  it('should handle module not found error with helpful message', async () => {
    // Setup test data
    mutationService.readMutationMetrics.mockResolvedValue(defaultOldMetrics)
    mockedExecSync.mockImplementation(() => {
      throw new Error('Cannot find module "some-module"')
    })

    // Run and verify
    await expect(runner.run()).rejects.toThrow('Module not found')

    // Verify the exact error message content
    const expectedModuleError =
      'Module not found: Cannot find module "some-module". ' +
      'This usually happens when a required dependency is missing. ' +
      'Please check your package.json and ensure all required dependencies are installed.'

    expect(mockedCore.setFailed).toHaveBeenCalledWith(expectedModuleError)
  })

  // Corrigindo o teste que estava falhando
  it('should test runMutationTests function directly', () => {
    // Direct testing of runMutationTests function
    const runMutationTests = (runner as any).runMutationTests.bind(runner)

    // Test successful run
    mockedExecSync.mockReturnValue(Buffer.from(''))
    runMutationTests()
    expect(mockedExecSync).toHaveBeenCalledWith(
      'npm run test:mutation',
      expect.objectContaining({ stdio: 'inherit' })
    )

    // Test with simple error
    mockedExecSync.mockImplementation(() => {
      throw new Error('Test error')
    })

    expect(() => runMutationTests()).toThrow(
      'Test execution failed: Test error'
    )
    expect(mockedCore.setFailed).toHaveBeenCalledWith(
      'Test execution failed: Test error'
    )

    // Não testamos diretamente erros especiais aqui, pois já estão cobertos pelos testes acima
  })
})
