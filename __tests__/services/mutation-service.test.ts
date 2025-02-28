import * as core from '@actions/core'
import * as fs from 'fs-extra'
import { execSync } from 'child_process'
import { MutationService } from '../../src/services/mutation-service'
import { MutationMetrics } from '../../src/types/mutation'

jest.mock('@actions/core')
jest.mock('fs-extra')
jest.mock('child_process')

const mockedCore = jest.mocked(core)
const mockedFs = jest.mocked(fs)
const mockedExecSync = jest.mocked(execSync)

describe('MutationService', () => {
  let service: MutationService
  const mockDate = new Date('2025-02-23T12:00:00Z')
  const defaultMetrics: MutationMetrics = {
    score: 85.5,
    killed: 90,
    survived: 10,
    timeout: 2,
    noCoverage: 3,
    mutants: {
      total: 105,
      mutated: ['src/file1.ts', 'src/file2.ts']
    },
    testFiles: ['test1.ts', 'test2.ts'],
    timestamp: '2025-02-23T12:00:00.000Z'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate)
    service = new MutationService()
  })

  describe('readMutationMetrics', () => {
    it('should read mutation metrics from file', async () => {
      mockedFs.existsSync.mockReturnValue(true)
      mockedFs.readJson.mockResolvedValue(defaultMetrics)
      const metrics = await service.readMutationMetrics()
      expect(metrics).toEqual(defaultMetrics)
      expect(mockedFs.readJson).toHaveBeenCalledWith('mutation-metrics.json')
    })

    it('should return default metrics when file does not exist', async () => {
      mockedFs.existsSync.mockReturnValue(false)
      const metrics = await service.readMutationMetrics()
      expect(metrics).toEqual({
        score: 0,
        killed: 0,
        survived: 0,
        timeout: 0,
        noCoverage: 0,
        mutants: {
          total: 0,
          mutated: []
        },
        testFiles: [],
        timestamp: mockDate.toISOString()
      })
    })

    it('should handle invalid JSON format', async () => {
      mockedFs.existsSync.mockReturnValue(true)
      mockedFs.readJson.mockRejectedValue(new SyntaxError('Invalid JSON'))
      const metrics = await service.readMutationMetrics()
      expect(metrics.score).toBe(0)
      expect(mockedCore.warning).toHaveBeenCalledWith(
        'Could not read previous mutation metrics. Using default baseline. Invalid JSON'
      )
    })

    it('should handle file permission errors', async () => {
      mockedFs.existsSync.mockReturnValue(true)
      mockedFs.readJson.mockRejectedValue(
        new Error('EACCES: permission denied')
      )
      const metrics = await service.readMutationMetrics()
      expect(metrics.score).toBe(0)
      expect(mockedCore.warning).toHaveBeenCalledWith(
        'Could not read previous mutation metrics. Using default baseline. EACCES: permission denied'
      )
    })
  })

  describe('getMutationMetrics', () => {
    it('should get mutation metrics from command output', async () => {
      mockedExecSync.mockReturnValue(
        Buffer.from(JSON.stringify(defaultMetrics))
      )
      const metrics = await service.getMutationMetrics()
      expect(metrics).toEqual({
        ...defaultMetrics,
        timestamp: mockDate.toISOString()
      })
      expect(mockedExecSync).toHaveBeenCalledWith(
        'npm run get:mutation-metrics --silent'
      )
    })

    it('should handle invalid JSON output from command', async () => {
      mockedExecSync.mockReturnValue(Buffer.from('Invalid JSON'))
      await expect(service.getMutationMetrics()).rejects.toThrow(
        'Unexpected token'
      )
    })

    it('should handle command execution errors', async () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('Command failed')
      })
      await expect(service.getMutationMetrics()).rejects.toThrow(
        'Command failed'
      )
    })

    it('should handle empty command output', async () => {
      mockedExecSync.mockReturnValue(Buffer.from(''))
      await expect(service.getMutationMetrics()).rejects.toThrow()
    })
  })

  describe('saveMetrics', () => {
    it('should save metrics to both files with correct format', async () => {
      await service.saveMetrics(defaultMetrics)

      expect(mockedFs.writeJson).toHaveBeenCalledWith(
        'mutation-metrics.json',
        defaultMetrics,
        { spaces: 2 }
      )
      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        'mutation.txt',
        defaultMetrics.score.toString()
      )
    })

    it('should handle write errors for metrics file', async () => {
      mockedFs.writeJson.mockRejectedValueOnce(new Error('Write failed'))
      await expect(service.saveMetrics(defaultMetrics)).rejects.toThrow(
        'Write failed'
      )
    })

    it('should handle write errors for score file', async () => {
      mockedFs.writeFile.mockRejectedValueOnce(
        new Error('Write failed') as never
      )
      await expect(service.saveMetrics(defaultMetrics)).rejects.toThrow(
        'Write failed'
      )
    })

    it('should handle metrics with zero score', async () => {
      const zeroMetrics = { ...defaultMetrics, score: 0 }
      await service.saveMetrics(zeroMetrics)
      expect(mockedFs.writeFile).toHaveBeenCalledWith('mutation.txt', '0')
      expect(mockedFs.writeJson).toHaveBeenCalledWith(
        'mutation-metrics.json',
        zeroMetrics,
        { spaces: 2 }
      )
    })
  })
})
