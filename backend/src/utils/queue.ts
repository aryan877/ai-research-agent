import Bull from 'bull';
import { processResearchJob, ResearchJobData } from '../jobs/researchJob';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const researchQueue = new Bull<ResearchJobData>('research processing', REDIS_URL);

// Register handler for the named job so Bull can route "process-research" tasks correctly.
researchQueue.process('process-research', processResearchJob);

researchQueue.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

researchQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

export const addResearchJob = async (requestId: string, topic: string, provider?: 'openai' | 'anthropic') => {
  return await researchQueue.add(
    'process-research',
    { requestId, topic, provider },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    }
  );
};
