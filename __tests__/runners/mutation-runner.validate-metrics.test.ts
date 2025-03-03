import * as core from '@actions/core'
import { MutationRunner } from '../../src/runners/mutation-runner'
import { MutationService } from '../../src/services/mutation-service'
import { MutationMetrics } from '../../src/types/mutation'

jest.mock('@actions/core')
jest.mock('../../src/services/mutation-service')

const mockedCore = jest.mocked(core)

describe('MutationRunner - validateMetrics', () => {
  let runner: MutationRunner
  let mutationService: jest.Mocked<MutationService>

  const defaultMetrics: MutationMetrics = {
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

  it('should throw error for non-numeric score', () => {
    const invalidMetrics: MutationMetrics = {
      ...defaultMetrics,
      score: 'invalid' as any
    }

    expect(() => runner['validateMetrics'](invalidMetrics)).toThrow(
      'Invalid score value in metrics'
    )
  })

  it('should throw error for NaN score', () => {
    // Create a spy on the isNaN function to verify it's being called
    const isNanSpy = jest.spyOn(global, 'isNaN')

    const invalidMetrics: MutationMetrics = {
      ...defaultMetrics,
      score: NaN
    }

    expect(() => runner['validateMetrics'](invalidMetrics)).toThrow(
      'Invalid score value in metrics'
    )
    expect(isNanSpy).toHaveBeenCalledWith(NaN)

    // Test with different ways NaN can be produced
    isNanSpy.mockClear()
    const nanFromDivision: MutationMetrics = {
      ...defaultMetrics,
      score: 0 / 0
    }
    expect(() => runner['validateMetrics'](nanFromDivision)).toThrow(
      'Invalid score value in metrics'
    )
    expect(isNanSpy).toHaveBeenCalledWith(0 / 0)
    expect(isNanSpy).toHaveReturnedWith(true)

    isNanSpy.mockClear()
    const nanFromParse: MutationMetrics = {
      ...defaultMetrics,
      score: Number.parseFloat('not a number')
    }
    expect(() => runner['validateMetrics'](nanFromParse)).toThrow(
      'Invalid score value in metrics'
    )
    expect(isNanSpy).toHaveBeenCalled()
    expect(isNanSpy).toHaveReturnedWith(true)

    // Restore the original implementation
    isNanSpy.mockRestore()
  })

  it('should warn for unusually high score', () => {
    const highScoreMetrics: MutationMetrics = {
      ...defaultMetrics,
      score: 101
    }

    runner['validateMetrics'](highScoreMetrics)
    expect(mockedCore.warning).toHaveBeenCalledWith(
      'Unusually high mutation score detected'
    )
  })

  it('should not warn for score equal to 100', () => {
    const perfectScoreMetrics: MutationMetrics = {
      ...defaultMetrics,
      score: 100
    }

    runner['validateMetrics'](perfectScoreMetrics)
    expect(mockedCore.warning).not.toHaveBeenCalledWith(
      'Unusually high mutation score detected'
    )
  })

  it('should handle Infinity values', () => {
    const infinityMetrics: MutationMetrics = {
      ...defaultMetrics,
      score: Infinity
    }

    expect(() => runner['validateMetrics'](infinityMetrics)).toThrow(
      'Invalid score value in metrics'
    )

    const negativeInfinityMetrics: MutationMetrics = {
      ...defaultMetrics,
      score: -Infinity
    }

    expect(() => runner['validateMetrics'](negativeInfinityMetrics)).toThrow(
      'Invalid score value in metrics'
    )
  })

  it('should handle undefined score', () => {
    const undefinedScoreMetrics = { ...defaultMetrics } as any
    delete undefinedScoreMetrics.score

    expect(() => runner['validateMetrics'](undefinedScoreMetrics)).toThrow(
      'Invalid score value in metrics'
    )
  })

  it('should handle non-numeric types', () => {
    // Test with object score
    const objectScoreMetrics = {
      ...defaultMetrics,
      score: {} as any
    }

    expect(() => runner['validateMetrics'](objectScoreMetrics)).toThrow(
      'Invalid score value in metrics'
    )

    // Test with boolean score
    const booleanScoreMetrics = {
      ...defaultMetrics,
      score: true as any
    }

    // In JavaScript, boolean true is converted to 1 when used as a number
    // This should not throw as it's a valid number
    expect(() => runner['validateMetrics'](booleanScoreMetrics)).not.toThrow()
  })
})
