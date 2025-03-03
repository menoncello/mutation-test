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

describe('MutationRunner - Edge Cases', () => {
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

  describe('handling negative scores', () => {
    it('should handle negative scores', async () => {
      const negativeMetrics = { ...defaultNewMetrics, score: -10 }
      mutationService.readMutationMetrics.mockResolvedValue(defaultOldMetrics)
      mutationService.getMutationMetrics.mockResolvedValue(negativeMetrics)
      mockedExecSync.mockReturnValue(Buffer.from(''))

      await expect(runner.run()).rejects.toThrow(
        'Tests failed: mutation score has decreased from 80 to -10'
      )

      expect(mockedCore.setFailed).toHaveBeenCalledWith(
        'Tests failed: mutation score has decreased from 80 to -10'
      )
    })

    it('should handle both negative scores with improvement', async () => {
      const improvingNegativeMetrics = { ...defaultNewMetrics, score: -1 }
      const worseNegativeOldMetrics = { ...defaultOldMetrics, score: -10 }
      mutationService.readMutationMetrics.mockResolvedValue(
        worseNegativeOldMetrics
      )
      mutationService.getMutationMetrics.mockResolvedValue(
        improvingNegativeMetrics
      )
      mockedExecSync.mockReturnValue(Buffer.from(''))

      await runner.run()

      expect(mockedCore.info).toHaveBeenCalledWith('Old mutation score: -10')
      expect(mockedCore.info).toHaveBeenCalledWith('New mutation score: -1')
    })

    it('should handle both negative scores with significant improvement', async () => {
      const bigImprovingNegativeMetrics = { ...defaultNewMetrics, score: -1 }
      const muchWorseNegativeOldMetrics = { ...defaultOldMetrics, score: -15 }
      mutationService.readMutationMetrics.mockResolvedValue(
        muchWorseNegativeOldMetrics
      )
      mutationService.getMutationMetrics.mockResolvedValue(
        bigImprovingNegativeMetrics
      )
      mockedExecSync.mockReturnValue(Buffer.from(''))

      await runner.run()

      expect(mockedCore.info).toHaveBeenCalledWith(
        'Significant improvement in mutation score: +14.00 points!'
      )
    })
  })

  describe('handling missing metrics properties', () => {
    it('should handle incomplete metrics', async () => {
      const incompleteMetrics = {
        score: 85,
        killed: 90,
        // Missing some properties
        mutants: {
          total: 105,
          mutated: ['src/file1.ts']
        },
        timestamp: '2025-02-23T12:00:00Z'
      } as any

      mutationService.readMutationMetrics.mockResolvedValue(defaultOldMetrics)
      mutationService.getMutationMetrics.mockResolvedValue(incompleteMetrics)
      mockedExecSync.mockReturnValue(Buffer.from(''))

      await runner.run()

      // Should still work with missing properties
      expect(mockedCore.info).toHaveBeenCalledWith('New mutation score: 85')
    })

    it('should handle minimal valid metrics', async () => {
      const minimalValidMetrics = {
        score: 85,
        mutants: {
          total: 100,
          mutated: []
        }
      } as any

      mutationService.readMutationMetrics.mockResolvedValue(defaultOldMetrics)
      mutationService.getMutationMetrics.mockResolvedValue(minimalValidMetrics)
      mockedExecSync.mockReturnValue(Buffer.from(''))

      await runner.run()

      expect(mockedCore.info).toHaveBeenCalledWith('New mutation score: 85')
    })
  })

  describe('handling mutated files array', () => {
    it('should show mutated files message when array is not empty', async () => {
      const metricsWithMutatedFiles = {
        ...defaultNewMetrics,
        mutants: {
          ...defaultNewMetrics.mutants,
          mutated: ['src/file1.ts', 'src/file2.ts']
        }
      }
      mutationService.readMutationMetrics.mockResolvedValue(defaultOldMetrics)
      mutationService.getMutationMetrics.mockResolvedValue(
        metricsWithMutatedFiles
      )
      mockedExecSync.mockReturnValue(Buffer.from(''))

      await runner.run()

      expect(mockedCore.debug).toHaveBeenCalledWith('Mutated files:')
      metricsWithMutatedFiles.mutants.mutated.forEach((file) => {
        expect(mockedCore.debug).toHaveBeenCalledWith(`  - ${file}`)
      })
    })

    describe('handling extremely large numbers', () => {
      it('should handle unusually high scores', async () => {
        const largeMetrics = { ...defaultNewMetrics, score: 101 }
        mutationService.readMutationMetrics.mockResolvedValue(defaultOldMetrics)
        mutationService.getMutationMetrics.mockResolvedValue(largeMetrics)
        mockedExecSync.mockReturnValue(Buffer.from(''))

        await runner.run()

        expect(mockedCore.warning).toHaveBeenCalledWith(
          'Unusually high mutation score detected'
        )
      })

      it('should handle very large scores', async () => {
        const veryLargeMetrics = { ...defaultNewMetrics, score: 1000 }
        mutationService.readMutationMetrics.mockResolvedValue(defaultOldMetrics)
        mutationService.getMutationMetrics.mockResolvedValue(veryLargeMetrics)
        mockedExecSync.mockReturnValue(Buffer.from(''))

        await runner.run()

        expect(mockedCore.warning).toHaveBeenCalledWith(
          'Unusually high mutation score detected'
        )
      })

      it('should not warn for score of exactly 100', async () => {
        const perfectScoreMetrics = { ...defaultNewMetrics, score: 100 }
        mutationService.readMutationMetrics.mockResolvedValue(defaultOldMetrics)
        mutationService.getMutationMetrics.mockResolvedValue(
          perfectScoreMetrics
        )
        mockedExecSync.mockReturnValue(Buffer.from(''))
        mockedCore.warning.mockReset()

        await runner.run()

        expect(mockedCore.warning).not.toHaveBeenCalledWith(
          'Unusually high mutation score detected'
        )
      })

      it('should handle Infinity value', async () => {
        const infinityMetrics = { ...defaultNewMetrics, score: Infinity }
        mutationService.readMutationMetrics.mockResolvedValue(defaultOldMetrics)
        mutationService.getMutationMetrics.mockResolvedValue(infinityMetrics)
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
})
