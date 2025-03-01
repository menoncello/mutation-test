export interface MutationMetrics {
    score: number;
    killed: number;
    survived: number;
    timeout: number;
    noCoverage: number;
    mutants: {
        total: number;
        mutated: string[];
    };
    testFiles: string[];
    timestamp: string;
}
