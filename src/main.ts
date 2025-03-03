import * as core from '@actions/core'
import { exec } from '@actions/exec'
import { MutationService } from './services/mutation-service'
import { MutationRunner } from './runners/mutation-runner'

export async function setupNodeVersion(): Promise<void> {
  try {
    const nodeVersion = core.getInput('node-version') || '20'
    await exec('volta install node@' + nodeVersion)
    await exec('volta run node --version')
  } catch (error) {
    core.warning(
      `Failed to set Node.js version: ${error}. Continuing with current version.`
    )
  }
}

export async function installDependencies(): Promise<void> {
  try {
    core.info('Checking for required dependencies...')

    try {
      await exec('stryker --version')
      core.info('Stryker is already installed')
    } catch {
      core.info('Installing Stryker...')
      await exec('npm install -g @stryker-mutator/core')
    }

    try {
      await exec('ts-node --version')
      core.info('ts-node is already installed')
    } catch {
      core.info('Installing ts-node...')
      await exec('npm install -g ts-node')
    }

    core.info('All dependencies are installed')
  } catch (error) {
    core.warning(
      `Failed to install dependencies: ${error}. This may cause issues.`
    )
  }
}

export async function run(): Promise<void> {
  await setupNodeVersion()
  await installDependencies()
  const mutationService = new MutationService()
  const mutationRunner = new MutationRunner(mutationService)
  await mutationRunner.run()
}
