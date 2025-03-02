import { jest } from '@jest/globals'

// Mock the main module that contains the run function
jest.mock('../src/main', () => ({
  run: jest.fn()
}))

describe('index', () => {
  let originalEnv: NodeJS.ProcessEnv
  let runMock: jest.Mock

  beforeEach(() => {
    // Save original process.env
    originalEnv = { ...process.env }

    // Clear all mocks before each test
    jest.clearAllMocks()

    // Get reference to the mocked run function
    const mainModule = jest.requireMock('../src/main') as { run: jest.Mock }
    runMock = mainModule.run
  })

  afterEach(() => {
    // Restore original process.env
    process.env = originalEnv

    // Clear module cache to ensure fresh imports
    jest.resetModules()
  })

  it('should correctly export the run function from main', async () => {
    // Import the index module
    const index = await import('../src/index')

    // Verify that run is exported
    expect(index).toHaveProperty('run')
    expect(typeof index.run).toBe('function')
  })

  it('should automatically execute run when GITHUB_ACTIONS env is set', async () => {
    // Set GITHUB_ACTIONS environment variable
    process.env.GITHUB_ACTIONS = 'true'

    // Import the index module which should trigger auto-execution
    await import('../src/index')

    // Verify that run was called
    expect(runMock).toHaveBeenCalledTimes(1)
  })

  it('should not automatically execute run when GITHUB_ACTIONS env is not set', async () => {
    // Ensure GITHUB_ACTIONS is not set
    delete process.env.GITHUB_ACTIONS

    // Import the index module
    await import('../src/index')

    // Verify that run was not called
    expect(runMock).not.toHaveBeenCalled()
  })
})
