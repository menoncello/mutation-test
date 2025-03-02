#!/usr/bin/env node

import * as fs from 'fs'
import * as path from 'path'

interface MutationReport {
  metrics?: {
    mutationScore?: number
    killed?: number
    survived?: number
    timedOut?: number
    noCoverage?: number
  }
  files?: Record<
    string,
    {
      mutants?: Array<unknown>
    }
  >
  testFiles?: string[]
}

interface Metrics {
  score: number
  killed: number
  survived: number
  timeout: number
  noCoverage: number
  mutants: {
    total: number
    mutated: string[]
  }
  testFiles: string[]
}

// Path to the Stryker mutation report
// For testing, we'll look for a temporary file first
let reportPath = path.resolve(process.cwd(), 'tmp-mutation-report.json')
if (!fs.existsSync(reportPath)) {
  reportPath = path.resolve(process.cwd(), 'mutation-report.json')
}

try {
  // Check if the report file exists
  if (!fs.existsSync(reportPath)) {
    console.error('Mutation report file not found at:', reportPath)
    process.exit(1)
  }

  // Read and parse the report
  const reportContent = fs.readFileSync(reportPath, 'utf8')
  const report = JSON.parse(reportContent) as MutationReport

  // Extract metrics
  const metrics: Metrics = {
    score: report.metrics?.mutationScore ?? 0,
    killed: report.metrics?.killed ?? 0,
    survived: report.metrics?.survived ?? 0,
    timeout: report.metrics?.timedOut ?? 0,
    noCoverage: report.metrics?.noCoverage ?? 0,
    mutants: {
      total: report.files
        ? Object.values(report.files).reduce(
            (acc, file) => acc + (file.mutants?.length ?? 0),
            0
          )
        : 0,
      mutated: report.files ? Object.keys(report.files) : []
    },
    testFiles: report.testFiles ?? []
  }

  // Output the metrics as JSON
  console.log(JSON.stringify(metrics, null, 2))
} catch (error) {
  console.error('Error extracting mutation metrics:', (error as Error).message)
  process.exit(1)
}
