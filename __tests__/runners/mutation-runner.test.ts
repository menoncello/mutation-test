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

describe('MutationRunner', () => {
  let runner: MutationRunner
  let mutationService: jest.Mocked<MutationService>
  const mockDate = new Date('2025-02-23T12:00:00Z')

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
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate)

    mutationService = {
      readMutationMetrics: jest.fn(),
      getMutationMetrics: jest.fn(),
      saveMetrics: jest.fn()
    } as any

    runner = new MutationRunner(mutationService)
  })

  describe('compareScores', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should not log improvement when exactly 10', () => {
      runner['compareScores'](80, 90) // improvement = 10
      expect(mockedCore.info).not.toHaveBeenCalledWith(
        expect.stringContaining('Significant improvement')
      )
    })

    it('should log improvement when greater than 10', () => {
      runner['compareScores'](80, 91) // improvement = 11
      expect(mockedCore.info).toHaveBeenCalledWith(
        expect.stringContaining('Significant improvement')
      )
      expect(mockedCore.info).toHaveBeenCalledWith(
        expect.stringContaining('+11.00')
      )
    })

    it('should throw error when score decreases', () => {
      expect(() => runner['compareScores'](90, 80)).toThrow(
        'Tests failed: mutation score has decreased from 90 to 80'
      )
    })
  })

  describe('validateMetrics', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })
    it('should throw error for non-numeric score', () => {
      const invalidMetrics: MutationMetrics = {
        ...defaultNewMetrics,
        score: 'invalid' as any
      }

      expect(() => runner['validateMetrics'](invalidMetrics)).toThrow(
        'Invalid score value in metrics'
      )
    })

    it('should throw error for NaN score', () => {
      const invalidMetrics: MutationMetrics = {
        ...defaultNewMetrics,
        score: NaN
      }

      expect(() => runner['validateMetrics'](invalidMetrics)).toThrow(
        'Invalid score value in metrics'
      )
    })

    it('should warn for unusually high score', () => {
      const highScoreMetrics: MutationMetrics = {
        ...defaultNewMetrics,
        score: 101
      }

      runner['validateMetrics'](highScoreMetrics)
      expect(mockedCore.warning).toHaveBeenCalledWith(
        'Unusually high mutation score detected'
      )
    })

    it('should not warn for score equal to 100', () => {
      const perfectScoreMetrics: MutationMetrics = {
        ...defaultNewMetrics,
        score: 100
      }

      runner['validateMetrics'](perfectScoreMetrics)
      expect(mockedCore.warning).not.toHaveBeenCalledWith(
        'Unusually high mutation score detected'
      )
    })
  })

  describe('command execution', () => {
    beforeEach(() => {
      jest.clearAllMocks()
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
  })

  describe('run', () => {
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
      })
    })

    describe('failure scenarios', () => {
      describe('test execution error handling', () => {
        it('should rethrow error when message includes Test execution failed', async () => {
          mutationService.readMutationMetrics.mockResolvedValue(
            defaultOldMetrics
          )
          const error = new Error('Some details')
          mockedExecSync.mockImplementation(() => {
            throw error
          })

          await expect(runner.run()).rejects.toThrow('Test execution failed')
          expect(mockedCore.setFailed).toHaveBeenCalledWith(
            'Test execution failed: Some details'
          )
        })

        it('should handle non-Error object without Test execution failed message', async () => {
          mutationService.readMutationMetrics.mockResolvedValue(
            defaultOldMetrics
          )
          mockedExecSync.mockImplementation(() => {
            throw 'Some other error'
          })

          await expect(runner.run()).rejects.toThrow('Test execution failed')
          expect(mockedCore.setFailed).toHaveBeenCalledWith(
            'Test execution failed: unknown error'
          )
        })
      })

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
      })

      it('should handle mutation test execution errors', async () => {
        mutationService.readMutationMetrics.mockResolvedValue(defaultOldMetrics)
        mockedExecSync.mockImplementation(() => {
          throw new Error('Test execution failed')
        })

        await expect(runner.run()).rejects.toThrow(
          'Test execution failed: Test execution failed'
        )

        expect(mockedCore.setFailed).toHaveBeenCalledWith(
          'Test execution failed: Test execution failed'
        )
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
    })

    describe('metrics logging', () => {
      beforeEach(() => {
        mutationService.readMutationMetrics.mockResolvedValue(defaultOldMetrics)
        mutationService.getMutationMetrics.mockResolvedValue(defaultNewMetrics)
      })

      it('should log all metrics in correct order', async () => {
        mockedExecSync.mockReturnValue('')
        await runner.run()

        const infoLogs = (mockedCore.info as jest.Mock).mock.calls.map(
          (call) => call[0]
        )

        expect(infoLogs).toContain('Running mutation tests...')
        expect(infoLogs).toContain('Old mutation score: 80')
        expect(infoLogs).toContain('New mutation score: 85')
        expect(infoLogs).toContain('Detailed metrics:')
        expect(infoLogs).toContain('- Total mutants: 105')
        expect(infoLogs).toContain('- Killed: 90')
        expect(infoLogs).toContain('- Survived: 10')
        expect(infoLogs).toContain('- Timeout: 2')
        expect(infoLogs).toContain('- No Coverage: 3')
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

      it('should log all mutated files', async () => {
        mutationService.readMutationMetrics.mockResolvedValue(defaultOldMetrics)
        mutationService.getMutationMetrics.mockResolvedValue(defaultNewMetrics)
        mockedExecSync.mockReturnValue('')

        await runner.run()

        defaultNewMetrics.mutants.mutated.forEach((file) => {
          expect(mockedCore.debug).toHaveBeenCalledWith(`  - ${file}`)
        })
      })
    })

    describe('edge cases', () => {
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

      it('should handle empty mutated files array', async () => {
        const emptyMutatedMetrics = {
          ...defaultNewMetrics,
          mutants: {
            ...defaultNewMetrics.mutants,
            mutated: []
          }
        }
        mutationService.readMutationMetrics.mockResolvedValue(defaultOldMetrics)
        mutationService.getMutationMetrics.mockResolvedValue(
          emptyMutatedMetrics
        )
        mockedExecSync.mockReturnValue(Buffer.from(''))

        await runner.run()

        expect(mockedCore.debug).not.toHaveBeenCalledWith('Mutated files:')
      })

      it('should handle non-numeric scores', async () => {
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

      it('should handle extremely large numbers', async () => {
        const largeMetrics = { ...defaultNewMetrics, score: 101 }
        mutationService.readMutationMetrics.mockResolvedValue(defaultOldMetrics)
        mutationService.getMutationMetrics.mockResolvedValue(largeMetrics)
        mockedExecSync.mockReturnValue(Buffer.from(''))

        await runner.run()

        expect(mockedCore.warning).toHaveBeenCalledWith(
          'Unusually high mutation score detected'
        )
      })
    })
  })
})
