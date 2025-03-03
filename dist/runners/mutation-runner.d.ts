import { MutationService } from '../services/mutation-service';
export declare class MutationRunner {
    private readonly mutationService;
    constructor(mutationService: MutationService);
    private validateMetrics;
    private logDetailedMetrics;
    private compareScores;
    private runMutationTests;
    private saveMetrics;
    run(): Promise<void>;
}
