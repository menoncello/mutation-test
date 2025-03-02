import * as core from '@actions/core';
import { exec } from '@actions/exec';
import fs from 'fs-extra';
import { execSync } from 'child_process';

class MutationService {
    metricsFile = 'mutation-metrics.json';
    async readMutationMetrics() {
        try {
            if (!fs.existsSync(this.metricsFile)) {
                return this.getDefaultMetrics();
            }
            const metrics = await fs.readJson(this.metricsFile);
            return metrics;
        }
        catch (error) {
            const errorMessage = error.message;
            core.warning(`Could not read previous mutation metrics. Using default baseline. ${errorMessage}`);
            return this.getDefaultMetrics();
        }
    }
    async getMutationMetrics() {
        const output = execSync('npm run get:mutation-metrics --silent').toString();
        const metrics = JSON.parse(output);
        return {
            ...metrics,
            timestamp: new Date().toISOString()
        };
    }
    async saveMetrics(metrics) {
        await fs.writeJson(this.metricsFile, metrics, { spaces: 2 });
    }
    getDefaultMetrics() {
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
        };
    }
}

class MutationRunner {
    mutationService;
    constructor(mutationService) {
        this.mutationService = mutationService;
    }
    validateMetrics(metrics) {
        if (isNaN(metrics.score)) {
            throw new Error('Invalid score value in metrics');
        }
        if (metrics.score > 100) {
            core.warning('Unusually high mutation score detected');
        }
    }
    logDetailedMetrics(metrics) {
        core.info('Detailed metrics:');
        core.info(`- Total mutants: ${metrics.mutants.total}`);
        core.info(`- Killed: ${metrics.killed}`);
        core.info(`- Survived: ${metrics.survived}`);
        core.info(`- Timeout: ${metrics.timeout}`);
        core.info(`- No Coverage: ${metrics.noCoverage}`);
        if (metrics.mutants.mutated.length) {
            core.debug('Mutated files:');
            metrics.mutants.mutated.forEach((file) => {
                core.debug(`  - ${file}`);
            });
        }
    }
    compareScores(oldScore, newScore) {
        if (newScore < oldScore) {
            throw new Error(`Tests failed: mutation score has decreased from ${oldScore} to ${newScore}`);
        }
        const improvement = newScore - oldScore;
        if (improvement > 10) {
            core.info(`Significant improvement in mutation score: +${improvement.toFixed(2)} points!`);
        }
    }
    runMutationTests() {
        core.info('Running mutation tests...');
        try {
            execSync('npm run test:mutation', { stdio: 'inherit' });
        }
        catch (error) {
            const errorMsg = `Test execution failed: ${error instanceof Error ? error.message : 'unknown error'}`;
            core.setFailed(errorMsg);
            throw new Error(errorMsg);
        }
    }
    async saveMetrics(metrics) {
        try {
            await this.mutationService.saveMetrics(metrics);
        }
        catch (error) {
            throw new Error(`Failed to save metrics: ${error.message}`);
        }
    }
    async run() {
        try {
            const oldMetrics = await this.mutationService.readMutationMetrics();
            this.validateMetrics(oldMetrics);
            core.info(`Old mutation score: ${oldMetrics.score}`);
            this.runMutationTests();
            const newMetrics = await this.mutationService.getMutationMetrics();
            this.validateMetrics(newMetrics);
            core.info(`New mutation score: ${newMetrics.score}`);
            this.compareScores(oldMetrics.score, newMetrics.score);
            this.logDetailedMetrics(newMetrics);
            await this.saveMetrics(newMetrics);
        }
        catch (error) {
            core.setFailed(error.message);
            throw error;
        }
    }
}

async function setupNodeVersion() {
    try {
        const nodeVersion = core.getInput('node-version') || '20';
        // Use volta to switch Node.js version
        await exec('volta install node@' + nodeVersion);
        await exec('volta run node --version');
    }
    catch (error) {
        core.warning(`Failed to set Node.js version: ${error}. Continuing with current version.`);
    }
}
async function run() {
    await setupNodeVersion();
    const mutationService = new MutationService();
    const mutationRunner = new MutationRunner(mutationService);
    await mutationRunner.run();
}

/**
 * The entrypoint for the action. This file simply imports and runs the action's
 * main logic.
 */
// Auto-execute when running as an action
if (process.env.GITHUB_ACTIONS) {
    run();
}

export { run };
//# sourceMappingURL=index.js.map
