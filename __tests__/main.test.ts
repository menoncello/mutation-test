import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { MutationService } from '../src/services/mutation-service'
import { MutationRunner } from '../src/runners/mutation-runner'

jest.mock('../src/services/mutation-service')
jest.mock('../src/runners/mutation-runner')
jest.mock('@actions/core')
jest.mock('@actions/exec')

describe('main', () => {
  const mockedMutationRunner = jest.mocked(MutationRunner)
  const mockedMutationService = jest.mocked(MutationService)
  const mockedCore = jest.mocked(core)
  const mockedExec = jest.mocked(exec)
  let runMock: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    runMock = jest.fn()
    mockedMutationRunner.mockImplementation(() => ({ run: runMock }) as any)
    mockedCore.getInput.mockReturnValue('')
    mockedExec.exec.mockResolvedValue(0)
  })

  it('should setup Node.js version and run MutationRunner', async () => {
    // Import the module that contains the main function
    const { run } = await import('../src/main')

    // Run the main function
    await run()

    // Verify that Node.js setup was attempted
    expect(mockedCore.getInput).toHaveBeenCalledWith('node-version')
    expect(mockedExec.exec).toHaveBeenCalledWith('volta install node@20')
    expect(mockedExec.exec).toHaveBeenCalledWith('volta run node --version')

    // Verify that MutationService and MutationRunner were created correctly
    expect(mockedMutationService).toHaveBeenCalledTimes(1)
    expect(mockedMutationRunner).toHaveBeenCalledTimes(1)
    expect(mockedMutationRunner).toHaveBeenCalledWith(
      expect.any(MutationService)
    )

    // Verify that run was called
    expect(runMock).toHaveBeenCalledTimes(1)
  })

  it('should use specified Node.js version when provided', async () => {
    // Mock the node-version input
    mockedCore.getInput.mockReturnValue('16')

    // Import and run main
    const { run } = await import('../src/main')
    await run()

    // Verify correct version was used
    expect(mockedExec.exec).toHaveBeenCalledWith('volta install node@16')
    expect(mockedExec.exec).toHaveBeenCalledWith('volta run node --version')
  })

  it('should handle Volta installation failure gracefully', async () => {
    // Mock exec to fail
    mockedExec.exec.mockRejectedValueOnce(new Error('Volta not found'))

    // Import and run main
    const { run } = await import('../src/main')
    await run()

    // Verify warning was logged
    expect(mockedCore.warning).toHaveBeenCalledWith(
      expect.stringContaining('Failed to set Node.js version')
    )

    // Verify that the mutation tests still ran
    expect(runMock).toHaveBeenCalledTimes(1)
  })
})
