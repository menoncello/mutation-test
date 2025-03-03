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
})
