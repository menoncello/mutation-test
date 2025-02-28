import * as core from '@actions/core'
import { execSync } from 'child_process'
import { MutationService } from '../services/mutation-service'
import { MutationMetrics } from '../types/mutation'

export class MutationRunner {
  constructor(private readonly mutationService: MutationService) {}

  private validateMetrics(metrics: MutationMetrics): void {
    if (isNaN(metrics.score)) {
      throw new Error('Invalid score value in metrics')
    }

    if (metrics.score > 100) {
      core.warning('Unusually high mutation score detected')
    }
  }

  private logDetailedMetrics(metrics: MutationMetrics): void {
    core.info('Detailed metrics:')
    core.info(`- Total mutants: ${metrics.mutants.total}`)
    core.info(`- Killed: ${metrics.killed}`)
    core.info(`- Survived: ${metrics.survived}`)
    core.info(`- Timeout: ${metrics.timeout}`)
    core.info(`- No Coverage: ${metrics.noCoverage}`)

    if (metrics.mutants.mutated.length) {
      core.debug('Mutated files:')
      metrics.mutants.mutated.forEach((file) => {
        core.debug(`  - ${file}`)
      })
    }
  }

  private compareScores(oldScore: number, newScore: number): void {
    if (newScore < oldScore) {
      throw new Error(
        `Tests failed: mutation score has decreased from ${oldScore} to ${newScore}`
      )
    }

    const improvement = newScore - oldScore
    if (improvement > 10) {
      core.info(
        `Significant improvement in mutation score: +${improvement.toFixed(2)} points!`
      )
    }
  }

  private runMutationTests(): void {
    core.info('Running mutation tests...')
    try {
      execSync('npm run test:mutation', { stdio: 'inherit' })
    } catch (error) {
      const errorMsg = `Test execution failed: ${error instanceof Error ? error.message : 'unknown error'}`
      core.setFailed(errorMsg)
      throw new Error(errorMsg)
    }
  }

  private async saveMetrics(metrics: MutationMetrics): Promise<void> {
    try {
      await this.mutationService.saveMetrics(metrics)
    } catch (error) {
      throw new Error(`Failed to save metrics: ${(error as Error).message}`)
    }
  }

  async run(): Promise<void> {
    try {
      const oldMetrics = await this.mutationService.readMutationMetrics()
      this.validateMetrics(oldMetrics)
      core.info(`Old mutation score: ${oldMetrics.score}`)

      this.runMutationTests()

      const newMetrics = await this.mutationService.getMutationMetrics()
      this.validateMetrics(newMetrics)
      core.info(`New mutation score: ${newMetrics.score}`)

      this.compareScores(oldMetrics.score, newMetrics.score)
      this.logDetailedMetrics(newMetrics)

      await this.saveMetrics(newMetrics)
    } catch (error) {
      core.setFailed((error as Error).message)
      throw error
    }
  }
}
