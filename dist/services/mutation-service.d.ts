import { MutationMetrics } from '../types/mutation';
export declare class MutationService {
    private readonly metricsFile;
    private readonly scoreFile;
    readMutationMetrics(): Promise<MutationMetrics>;
    getMutationMetrics(): Promise<MutationMetrics>;
    saveMetrics(metrics: MutationMetrics): Promise<void>;
    private getDefaultMetrics;
}
