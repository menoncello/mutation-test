'use strict';

var core = require('@actions/core');
var exec = require('@actions/exec');
var fs = require('fs-extra');
var child_process = require('child_process');

function _interopNamespaceDefault(e) {
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n.default = e;
    return Object.freeze(n);
}

var core__namespace = /*#__PURE__*/_interopNamespaceDefault(core);

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
            core__namespace.warning(`Could not read previous mutation metrics. Using default baseline. ${errorMessage}`);
            return this.getDefaultMetrics();
        }
    }
    async getMutationMetrics() {
        const output = child_process.execSync('npm run get:mutation-metrics --silent').toString();
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
            core__namespace.warning('Unusually high mutation score detected');
        }
    }
    logDetailedMetrics(metrics) {
        core__namespace.info('Detailed metrics:');
        core__namespace.info(`- Total mutants: ${metrics.mutants.total}`);
        core__namespace.info(`- Killed: ${metrics.killed}`);
        core__namespace.info(`- Survived: ${metrics.survived}`);
        core__namespace.info(`- Timeout: ${metrics.timeout}`);
        core__namespace.info(`- No Coverage: ${metrics.noCoverage}`);
        if (metrics.mutants.mutated.length) {
            core__namespace.debug('Mutated files:');
            metrics.mutants.mutated.forEach((file) => {
                core__namespace.debug(`  - ${file}`);
            });
        }
    }
    compareScores(oldScore, newScore) {
        if (newScore < oldScore) {
            throw new Error(`Tests failed: mutation score has decreased from ${oldScore} to ${newScore}`);
        }
        const improvement = newScore - oldScore;
        if (improvement > 10) {
            core__namespace.info(`Significant improvement in mutation score: +${improvement.toFixed(2)} points!`);
        }
    }
    runMutationTests() {
        core__namespace.info('Running mutation tests...');
        try {
            child_process.execSync('npm run test:mutation', { stdio: 'inherit' });
        }
        catch (error) {
            const errorMsg = `Test execution failed: ${error instanceof Error ? error.message : 'unknown error'}`;
            core__namespace.setFailed(errorMsg);
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
            core__namespace.info(`Old mutation score: ${oldMetrics.score}`);
            this.runMutationTests();
            const newMetrics = await this.mutationService.getMutationMetrics();
            this.validateMetrics(newMetrics);
            core__namespace.info(`New mutation score: ${newMetrics.score}`);
            this.compareScores(oldMetrics.score, newMetrics.score);
            this.logDetailedMetrics(newMetrics);
            await this.saveMetrics(newMetrics);
        }
        catch (error) {
            core__namespace.setFailed(error.message);
            throw error;
        }
    }
}

async function setupNodeVersion() {
    try {
        const nodeVersion = core__namespace.getInput('node-version') || '20';
        // Use volta to switch Node.js version
        await exec.exec('volta install node@' + nodeVersion);
        await exec.exec('volta run node --version');
    }
    catch (error) {
        core__namespace.warning(`Failed to set Node.js version: ${error}. Continuing with current version.`);
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

exports.run = run;
//# sourceMappingURL=index.js.map
