import { MutationRunner } from '../../src/runners/mutation-runner'
import {
  mockedCore,
  defaultNewMetrics,
  createMutationRunner,
  resetMocks,
  setupDefaultTestConditions
} from '../utils/mutation-runner.test-utils'

describe('MutationRunner', () => {
  let runner: MutationRunner
  let mutationService: jest.Mocked<any>
  const mockDate = new Date('2025-02-23T12:00:00Z')

  beforeEach(() => {
    resetMocks()
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate)

    const setup = createMutationRunner()
    runner = setup.runner
    mutationService = setup.mutationService
  })

  describe('metrics logging', () => {
    beforeEach(() => {
      setupDefaultTestConditions(mutationService)
    })

    it('should log all metrics in correct order', async () => {
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
      await runner.run()

      defaultNewMetrics.mutants.mutated.forEach((file) => {
        expect(mockedCore.debug).toHaveBeenCalledWith(`  - ${file}`)
      })
    })
  })
})
