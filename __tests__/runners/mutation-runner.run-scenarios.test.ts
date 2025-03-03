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

describe('MutationRunner - Run Method Scenarios', () => {
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

  describe('successful scenarios', () => {
    it('should pass when new score is higher', async () => {
      // Setup test data
      mutationService.readMutationMetrics.mockResolvedValue(defaultOldMetrics)
      mutationService.getMutationMetrics.mockResolvedValue(defaultNewMetrics)
      mutationService.saveMetrics.mockResolvedValue()
      mockedExecSync.mockReturnValue(Buffer.from(''))

      await runner.run()

      expect(mockedCore.setFailed).not.toHaveBeenCalled()
      expect(mutationService.saveMetrics).toHaveBeenCalledWith(
        defaultNewMetrics
      )
    })

    it('should pass when scores are equal', async () => {
      // Setup test data
      const sameScoreMetrics = {
        ...defaultNewMetrics,
        score: defaultOldMetrics.score
      }
      mutationService.readMutationMetrics.mockResolvedValue(defaultOldMetrics)
      mutationService.getMutationMetrics.mockResolvedValue(sameScoreMetrics)
      mutationService.saveMetrics.mockResolvedValue()
      mockedExecSync.mockReturnValue(Buffer.from(''))

      await runner.run()

      expect(mockedCore.setFailed).not.toHaveBeenCalled()
    })

    it('should pass with zero previous score', async () => {
      // Setup test data
      const zeroScoreMetrics = { ...defaultOldMetrics, score: 0 }
      mutationService.readMutationMetrics.mockResolvedValue(zeroScoreMetrics)
      mutationService.getMutationMetrics.mockResolvedValue(defaultNewMetrics)
      mutationService.saveMetrics.mockResolvedValue()
      mockedExecSync.mockReturnValue(Buffer.from(''))

      await runner.run()

      expect(mockedCore.setFailed).not.toHaveBeenCalled()
      expect(mockedCore.info).toHaveBeenCalledWith('Old mutation score: 0')
      expect(mockedCore.info).toHaveBeenCalledWith('New mutation score: 85')
      expect(mockedCore.info).toHaveBeenCalledWith(
        'Significant improvement in mutation score: +85.00 points!'
      )
      expect(mutationService.saveMetrics).toHaveBeenCalledWith(
        defaultNewMetrics
      )
    })

    it('should log significant improvements', async () => {
      const highScoreMetrics = { ...defaultNewMetrics, score: 95 }
      mutationService.readMutationMetrics.mockResolvedValue(defaultOldMetrics)
      mutationService.getMutationMetrics.mockResolvedValue(highScoreMetrics)
      mockedExecSync.mockReturnValue('')

      await runner.run()

      expect(mockedCore.info).toHaveBeenCalledWith(
        'Significant improvement in mutation score: +15.00 points!'
      )
    })
  })

  describe('failure scenarios', () => {
    it('should fail when new score is lower', async () => {
      const lowerMetrics = { ...defaultNewMetrics, score: 75 }
      mutationService.readMutationMetrics.mockResolvedValue(defaultOldMetrics)
      mutationService.getMutationMetrics.mockResolvedValue(lowerMetrics)
      mockedExecSync.mockReturnValue(Buffer.from(''))

      await expect(runner.run()).rejects.toThrow(
        'Tests failed: mutation score has decreased from 80 to 75'
      )

      expect(mockedCore.setFailed).toHaveBeenCalledWith(
        'Tests failed: mutation score has decreased from 80 to 75'
      )
      expect(mockedCore.info).toHaveBeenCalledWith('Old mutation score: 80')
      expect(mockedCore.info).toHaveBeenCalledWith('New mutation score: 75')
    })

    it('should handle minimal score decrease', async () => {
      const slightlyLowerMetrics = { ...defaultNewMetrics, score: 79.9 }
      mutationService.readMutationMetrics.mockResolvedValue(defaultOldMetrics)
      mutationService.getMutationMetrics.mockResolvedValue(slightlyLowerMetrics)
      mockedExecSync.mockReturnValue(Buffer.from(''))

      await expect(runner.run()).rejects.toThrow(
        'Tests failed: mutation score has decreased from 80 to 79.9'
      )

      expect(mockedCore.setFailed).toHaveBeenCalledWith(
        'Tests failed: mutation score has decreased from 80 to 79.9'
      )
      expect(mockedCore.info).toHaveBeenCalledWith('Old mutation score: 80')
      expect(mockedCore.info).toHaveBeenCalledWith('New mutation score: 79.9')
    })

    it('should handle metrics save errors', async () => {
      mutationService.readMutationMetrics.mockResolvedValue(defaultOldMetrics)
      mutationService.getMutationMetrics.mockResolvedValue(defaultNewMetrics)
      mutationService.saveMetrics.mockRejectedValueOnce(
        new Error('Save failed')
      )
      mockedExecSync.mockReturnValue(Buffer.from(''))

      await expect(runner.run()).rejects.toThrow(
        'Failed to save metrics: Save failed'
      )

      expect(mockedCore.setFailed).toHaveBeenCalledWith(
        'Failed to save metrics: Save failed'
      )
    })

    it('should handle invalid metrics', async () => {
      const invalidMetrics = { ...defaultNewMetrics, score: 'invalid' as any }
      mutationService.readMutationMetrics.mockResolvedValue(defaultOldMetrics)
      mutationService.getMutationMetrics.mockResolvedValue(invalidMetrics)
      mockedExecSync.mockReturnValue(Buffer.from(''))

      await expect(runner.run()).rejects.toThrow(
        'Invalid score value in metrics'
      )

      expect(mockedCore.setFailed).toHaveBeenCalledWith(
        'Invalid score value in metrics'
      )
    })
  })
})
