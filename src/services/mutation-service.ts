import * as core from '@actions/core'
import * as fs from 'fs-extra'
import { execSync } from 'child_process'
import { MutationMetrics } from '../types/mutation'

export class MutationService {
  private readonly metricsFile = 'mutation-metrics.json'
  private readonly scoreFile = 'mutation.txt'

  async readMutationMetrics(): Promise<MutationMetrics> {
    try {
      if (!fs.existsSync(this.metricsFile)) {
        return this.getDefaultMetrics()
      }
      const metrics = await fs.readJson(this.metricsFile)
      return metrics as MutationMetrics
    } catch (error) {
      const errorMessage = (error as Error).message
      core.warning(
        `Could not read previous mutation metrics. Using default baseline. ${errorMessage}`
      )
      return this.getDefaultMetrics()
    }
  }

  async getMutationMetrics(): Promise<MutationMetrics> {
    const output = execSync('npm run get:mutation-metrics --silent').toString()
    const metrics = JSON.parse(output)

    return {
      ...metrics,
      timestamp: new Date().toISOString()
    }
  }

  async saveMetrics(metrics: MutationMetrics): Promise<void> {
    await fs.writeJson(this.metricsFile, metrics, { spaces: 2 })
    await fs.writeFile(this.scoreFile, metrics.score.toString())
  }

  private getDefaultMetrics(): MutationMetrics {
    return {
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
      timestamp: new Date().toISOString()
    }
  }
}
