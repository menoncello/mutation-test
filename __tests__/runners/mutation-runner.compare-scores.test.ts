import * as core from '@actions/core'
import { MutationRunner } from '../../src/runners/mutation-runner'
import { MutationService } from '../../src/services/mutation-service'

jest.mock('@actions/core')
jest.mock('../../src/services/mutation-service')

const mockedCore = jest.mocked(core)

describe('MutationRunner - compareScores', () => {
  let runner: MutationRunner
  let mutationService: jest.Mocked<MutationService>

  beforeEach(() => {
    jest.clearAllMocks()

    mutationService = {
      readMutationMetrics: jest.fn(),
      getMutationMetrics: jest.fn(),
      saveMetrics: jest.fn()
    } as any

    runner = new MutationRunner(mutationService)
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

  it('should format decimal improvements correctly', () => {
    runner['compareScores'](70, 85.5)
    expect(mockedCore.info).toHaveBeenCalledWith(
      'Significant improvement in mutation score: +15.50 points!'
    )
  })

  it('should handle zero to positive improvements', () => {
    runner['compareScores'](0, 80)
    expect(mockedCore.info).toHaveBeenCalledWith(
      'Significant improvement in mutation score: +80.00 points!'
    )
  })

  it('should handle negative to less negative improvements', () => {
    runner['compareScores'](-10, -5)
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      expect.stringContaining('Significant improvement')
    )
  })

  it('should handle significant negative to less negative improvements', () => {
    runner['compareScores'](-20, -5)
    expect(mockedCore.info).toHaveBeenCalledWith(
      'Significant improvement in mutation score: +15.00 points!'
    )
  })

  it('should handle boundary condition for significant improvements', () => {
    // Just below threshold - should not log
    mockedCore.info.mockClear()
    runner['compareScores'](80, 90) // improvement = 10, should not log
    expect(mockedCore.info).not.toHaveBeenCalledWith(
      expect.stringContaining('Significant improvement')
    )

    // Just above threshold - should log
    mockedCore.info.mockClear()
    runner['compareScores'](80, 90.01) // improvement = 10.01, should log
    expect(mockedCore.info).toHaveBeenCalledWith(
      'Significant improvement in mutation score: +10.01 points!'
    )
  })
})
