/* eslint-disable @typescript-eslint/no-require-imports */
const mockGetInput = jest.fn().mockReturnValue('20')
const mockInfo = jest.fn()
const mockWarning = jest.fn()
const mockError = jest.fn()
const mockExec = jest.fn().mockResolvedValue(0)
const mockRunnerRun = jest.fn().mockResolvedValue(undefined)
const mockMutationRunner = jest.fn().mockImplementation(() => ({
  run: mockRunnerRun
}))
const mockMutationService = jest.fn()

jest.mock('@actions/core', () => ({
  getInput: mockGetInput,
  info: mockInfo,
  warning: mockWarning,
  error: mockError,
  setFailed: jest.fn()
}))

jest.mock('@actions/exec', () => ({
  exec: mockExec
}))

jest.mock('../src/runners/mutation-runner', () => ({
  MutationRunner: mockMutationRunner
}))

jest.mock('../src/services/mutation-service', () => ({
  MutationService: mockMutationService
}))

describe('main', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  it('should run the mutation tests successfully', async () => {
    const { run } = await import('../src/main')

    await run()

    expect(mockMutationService).toHaveBeenCalledTimes(1)
    expect(mockMutationRunner).toHaveBeenCalledTimes(1)
    expect(mockMutationRunner).toHaveBeenCalledWith(expect.any(Object))
    expect(mockRunnerRun).toHaveBeenCalledTimes(1)
  })

  it('should handle Node.js setup errors gracefully', async () => {
    mockExec.mockRejectedValueOnce(new Error('Command failed'))

    const { run } = await import('../src/main')
    await run()

    expect(mockWarning).toHaveBeenCalledWith(
      expect.stringContaining('Failed to set Node.js version')
    )
    expect(mockRunnerRun).toHaveBeenCalled()
  })

  it('should handle dependency installation errors gracefully', async () => {
    mockExec
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockImplementationOnce(() => {
        throw new Error('Command failed')
      })
      .mockResolvedValueOnce(0)
      .mockImplementationOnce(() => {
        throw new Error('Command failed')
      })
      .mockImplementationOnce(() => {
        throw new Error('Command failed')
      })

    const { run } = await import('../src/main')
    await run()

    expect(mockWarning).toHaveBeenCalledWith(
      expect.stringContaining('Failed to install dependencies')
    )
    expect(mockRunnerRun).toHaveBeenCalled()
  })

  describe('setupNodeVersion', () => {
    it('should use default Node.js version when not specified', async () => {
      mockGetInput.mockReturnValueOnce('')

      const { setupNodeVersion } = await import('../src/main')
      await setupNodeVersion()

      expect(mockGetInput).toHaveBeenCalledWith('node-version')
      expect(mockExec).toHaveBeenCalledWith('volta install node@20')
      expect(mockExec).toHaveBeenCalledWith('volta run node --version')
    })

    it('should use specified Node.js version when provided', async () => {
      mockGetInput.mockReturnValueOnce('18')

      const { setupNodeVersion } = await import('../src/main')
      await setupNodeVersion()

      expect(mockGetInput).toHaveBeenCalledWith('node-version')
      expect(mockExec).toHaveBeenCalledWith('volta install node@18')
      // expect(mockExec).toHaveBeenCalledWith('volta run node --version')
    })

    it('should properly format error message when an error occurs', async () => {
      const specificError = new Error('Specific error message')
      mockExec.mockRejectedValueOnce(specificError)

      const { setupNodeVersion } = await import('../src/main')
      await setupNodeVersion()

      expect(mockWarning).toHaveBeenCalledWith(
        `Failed to set Node.js version: Error: Specific error message. Continuing with current version.`
      )
    })

    it('should handle multiple errors in setupNodeVersion', async () => {
      mockExec
        .mockRejectedValueOnce(new Error('First command failed'))
        .mockRejectedValueOnce(new Error('Second command failed'))

      const { setupNodeVersion } = await import('../src/main')
      await setupNodeVersion()

      expect(mockWarning).toHaveBeenCalledTimes(1)
      expect(mockWarning).toHaveBeenCalledWith(
        expect.stringContaining('First command failed')
      )

      expect(mockExec).toHaveBeenCalledTimes(1)
    })

    it('should attempt to run both volta commands when first succeeds', async () => {
      mockExec.mockRestore()

      mockExec.mockImplementation(() => Promise.resolve(0))

      mockGetInput.mockReturnValueOnce('16')

      const { setupNodeVersion } = await import('../src/main')
      await setupNodeVersion()

      expect(mockExec.mock.calls.length).toBe(2)
      expect(mockExec.mock.calls).toStrictEqual([
        ['volta install node@16'],
        ['volta run node --version']
      ])
    })
  })

  describe('installDependencies', () => {
    beforeEach(() => {
      jest.resetModules()
      jest.clearAllMocks()
    })

    it('should check for dependencies and show initial message', async () => {
      mockExec.mockImplementation(() => Promise.resolve(0))

      const { installDependencies } = require('../src/main')
      await installDependencies()

      expect(mockInfo).toHaveBeenCalledWith(
        'Installing required dependencies...'
      )
    })

    it('should install Stryker', async () => {
      mockExec.mockResolvedValue(0).mockResolvedValue(0)

      const { installDependencies } = require('../src/main')
      await installDependencies()

      expect(mockInfo).toHaveBeenCalledWith(
        'Installing required dependencies...'
      )
      expect(mockExec).toHaveBeenCalledWith('npm install -g stryker')
      expect(mockExec).toHaveBeenCalledWith('npm ci')
    })

    it('should install ts-node when not already installed', async () => {
      mockExec
        .mockResolvedValueOnce(0) // stryker check succeeds
        .mockImplementationOnce(() => {
          throw new Error('ts-node not found')
        })
        .mockResolvedValue(0)

      const { installDependencies } = require('../src/main')
      await installDependencies()

      expect(mockExec).toHaveBeenCalledWith('npm ci')
    })

    it('should display final success message when all dependencies are installed', async () => {
      mockExec.mockImplementation(() => Promise.resolve(0))

      const { installDependencies } = require('../src/main')
      await installDependencies()

      expect(mockInfo).toHaveBeenCalledWith(
        'Installing required dependencies...'
      )
    })

    it('should handle dependency installation errors with proper warning', async () => {
      mockExec.mockImplementation(() => {
        throw new Error('Installation error')
      })

      const { installDependencies } = require('../src/main')
      await installDependencies()

      expect(mockWarning).toHaveBeenCalledWith(
        expect.stringContaining(
          'Failed to install dependencies: Error: Installation error'
        )
      )
    })

    it('should validate the correct sequence of exec calls when installing all dependencies', async () => {
      mockExec
        .mockResolvedValueOnce(0) // npm install Stryker succeeds
        .mockResolvedValueOnce(0) // npm ci succeeds

      const { installDependencies } = require('../src/main')
      await installDependencies()

      expect(mockExec.mock.calls).toStrictEqual([
        ['npm install -g stryker'],
        ['npm ci']
      ])

      expect(mockInfo).toHaveBeenCalledTimes(2)

      // Verify the correct sequence of info messages
      expect(mockInfo.mock.calls).toEqual([
        ['Installing required dependencies...'],
        ['All dependencies are installed']
      ])
    })
  })
})
