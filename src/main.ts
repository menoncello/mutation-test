import * as core from '@actions/core'
import { exec } from '@actions/exec'
import { MutationService } from './services/mutation-service'
import { MutationRunner } from './runners/mutation-runner'

async function setupNodeVersion(): Promise<void> {
  try {
    const nodeVersion = core.getInput('node-version') || '20'
    // Use volta to switch Node.js version
    await exec('volta install node@' + nodeVersion)
    await exec('volta run node --version')
  } catch (error) {
    core.warning(
      `Failed to set Node.js version: ${error}. Continuing with current version.`
    )
  }
}

export async function run(): Promise<void> {
  await setupNodeVersion()
  const mutationService = new MutationService()
  const mutationRunner = new MutationRunner(mutationService)
  await mutationRunner.run()
}
