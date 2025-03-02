import { MutationMetrics } from '../types/mutation';
export declare class MutationService {
    private readonly metricsFile;
    readMutationMetrics(): Promise<MutationMetrics>;
    getMutationMetrics(): Promise<MutationMetrics>;
    saveMetrics(metrics: MutationMetrics): Promise<void>;
    private getDefaultMetrics;
}
