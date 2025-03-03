import { MutationRunner } from '../../src/runners/mutation-runner'
import {
  mockedCore,
  defaultOldMetrics,
  defaultNewMetrics,
  createMutationRunner,
  resetMocks,
  setupDefaultTestConditions
} from '../utils/mutation-runner.test-utils'

describe('MutationRunner - Run Method Scenarios', () => {
  let runner: MutationRunner
  let mutationService: jest.Mocked<any>

  beforeEach(() => {
    resetMocks()

    const setup = createMutationRunner()
    runner = setup.runner
    mutationService = setup.mutationService
  })

  describe('successful scenarios', () => {
    it('should pass when new score is higher', async () => {
      // Setup test data
      setupDefaultTestConditions(mutationService)

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
      setupDefaultTestConditions(
        mutationService,
        defaultOldMetrics,
        sameScoreMetrics
      )

      await runner.run()

      expect(mockedCore.setFailed).not.toHaveBeenCalled()
    })

    it('should pass with zero previous score', async () => {
      // Setup test data
      const zeroScoreMetrics = { ...defaultOldMetrics, score: 0 }
      setupDefaultTestConditions(
        mutationService,
        zeroScoreMetrics,
        defaultNewMetrics
      )

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
      setupDefaultTestConditions(
        mutationService,
        defaultOldMetrics,
        highScoreMetrics
      )

      await runner.run()

      expect(mockedCore.info).toHaveBeenCalledWith(
        'Significant improvement in mutation score: +15.00 points!'
      )
    })
  })

  describe('failure scenarios', () => {
    it('should fail when new score is lower', async () => {
      const lowerMetrics = { ...defaultNewMetrics, score: 75 }
      setupDefaultTestConditions(
        mutationService,
        defaultOldMetrics,
        lowerMetrics
      )

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
      setupDefaultTestConditions(
        mutationService,
        defaultOldMetrics,
        slightlyLowerMetrics
      )

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
      setupDefaultTestConditions(mutationService)
      mutationService.saveMetrics.mockRejectedValueOnce(
        new Error('Save failed')
      )

      await expect(runner.run()).rejects.toThrow(
        'Failed to save metrics: Save failed'
      )

      expect(mockedCore.setFailed).toHaveBeenCalledWith(
        'Failed to save metrics: Save failed'
      )
    })

    it('should handle invalid metrics', async () => {
      const invalidMetrics = { ...defaultNewMetrics, score: 'invalid' as any }
      setupDefaultTestConditions(
        mutationService,
        defaultOldMetrics,
        invalidMetrics
      )

      await expect(runner.run()).rejects.toThrow(
        'Invalid score value in metrics'
      )

      expect(mockedCore.setFailed).toHaveBeenCalledWith(
        'Invalid score value in metrics'
      )
    })
  })
})
