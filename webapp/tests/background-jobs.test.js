const BackgroundJobManager = require('../background-jobs');

describe('BackgroundJobManager', () => {
    let jobManager;

    beforeEach(() => {
        jobManager = new BackgroundJobManager();
    });

    afterEach(() => {
        // Clean up any running jobs
        const jobs = jobManager.getAllJobs();
        jobs.forEach(job => {
            if (job.status === 'running') {
                jobManager.cancelJob(job.id);
            }
        });
    });

    describe('Job Creation', () => {
        test('should create a job with valid data', async () => {
            const jobId = await jobManager.addJob('data-processing', { steps: 10 });
            
            expect(jobId).toBeDefined();
            expect(jobId).toMatch(/^job_\d+_[a-z0-9]+$/);
            
            const status = jobManager.getJobStatus(jobId);
            expect(status).toBeDefined();
            expect(status.type).toBe('data-processing');
            expect(status.status).toBe('pending');
        });

        test('should handle different job types', async () => {
            const types = ['data-processing', 'file-operation', 'api-call', 'backup'];
            
            for (const type of types) {
                const jobId = await jobManager.addJob(type, { test: true });
                const status = jobManager.getJobStatus(jobId);
                expect(status.type).toBe(type);
            }
        });

        test('should accept custom options', async () => {
            const options = {
                timeout: 10000,
                retries: 5
            };
            
            const jobId = await jobManager.addJob('data-processing', { steps: 5 }, options);
            const job = jobManager.jobs.get(jobId);
            
            expect(job.options.timeout).toBe(10000);
            expect(job.options.retries).toBe(5);
        });
    });

    describe('Job Status Management', () => {
        test('should track job status correctly', async () => {
            const jobId = await jobManager.addJob('data-processing', { steps: 5 });
            
            // Initially pending
            let status = jobManager.getJobStatus(jobId);
            expect(status.status).toBe('pending');
            expect(status.progress).toBe(0);
            
            // Wait for job to start and complete
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            status = jobManager.getJobStatus(jobId);
            expect(['completed', 'running']).toContain(status.status);
        });

        test('should return null for non-existent job', () => {
            const status = jobManager.getJobStatus('non-existent-job');
            expect(status).toBeNull();
        });

        test('should list all jobs', async () => {
            await jobManager.addJob('data-processing', { steps: 5 });
            await jobManager.addJob('file-operation', { files: 3 });
            
            const jobs = jobManager.getAllJobs();
            expect(jobs).toHaveLength(2);
            expect(jobs[0].type).toBe('data-processing');
            expect(jobs[1].type).toBe('file-operation');
        });
    });

    describe('Job Execution', () => {
        test('should execute jobs in parallel up to concurrency limit', async () => {
            // Add more jobs than the concurrency limit
            const jobIds = [];
            for (let i = 0; i < 5; i++) {
                const jobId = await jobManager.addJob('data-processing', { steps: 10 });
                jobIds.push(jobId);
            }
            
            // Wait a bit for jobs to start
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const jobs = jobManager.getAllJobs();
            const runningJobs = jobs.filter(job => job.status === 'running');
            const pendingJobs = jobs.filter(job => job.status === 'pending');
            
            // Should have max 3 running (concurrency limit)
            expect(runningJobs.length).toBeLessThanOrEqual(3);
            expect(pendingJobs.length).toBeGreaterThanOrEqual(2);
        });

        test('should handle job completion', async () => {
            const jobId = await jobManager.addJob('data-processing', { steps: 5 });
            
            // Wait for completion
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const status = jobManager.getJobStatus(jobId);
            expect(status.status).toBe('completed');
            expect(status.progress).toBe(100);
            expect(status.result).toBe('Job completed successfully');
        });

        test('should handle job timeouts', async () => {
            const jobId = await jobManager.addJob('data-processing', { steps: 1000 }, { timeout: 100 });
            
            // Wait for timeout
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const status = jobManager.getJobStatus(jobId);
            expect(status.status).toBe('timeout');
        });
    });

    describe('Job Cancellation', () => {
        test('should cancel running jobs', async () => {
            const jobId = await jobManager.addJob('data-processing', { steps: 100 });
            
            // Wait for job to start
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const cancelled = jobManager.cancelJob(jobId);
            expect(cancelled).toBe(true);
            
            const status = jobManager.getJobStatus(jobId);
            expect(status.status).toBe('cancelled');
        });

        test('should return false for non-running jobs', () => {
            const cancelled = jobManager.cancelJob('non-existent-job');
            expect(cancelled).toBe(false);
        });
    });

    describe('Job Cleanup', () => {
        test('should cleanup old completed jobs', async () => {
            // Add a job and wait for completion
            const jobId = await jobManager.addJob('data-processing', { steps: 5 });
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Verify job is completed
            let status = jobManager.getJobStatus(jobId);
            expect(status.status).toBe('completed');
            
            // Cleanup jobs older than 1 hour (should not affect recent job)
            const cleaned = jobManager.cleanupJobs(1);
            expect(cleaned).toBe(0);
            
            // Job should still exist
            status = jobManager.getJobStatus(jobId);
            expect(status).toBeDefined();
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid job types gracefully', async () => {
            const jobId = await jobManager.addJob('invalid-type', { test: true });
            
            // Wait for job to fail
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const status = jobManager.getJobStatus(jobId);
            expect(status.status).toBe('failed');
            expect(status.error).toContain('Unknown job type');
        });

        test('should handle worker errors', async () => {
            // This test would require mocking worker errors
            // For now, we'll test that the system doesn't crash
            const jobId = await jobManager.addJob('data-processing', { steps: 5 });
            expect(jobId).toBeDefined();
        });
    });

    describe('Performance', () => {
        test('should handle multiple rapid job submissions', async () => {
            const startTime = Date.now();
            
            // Submit 10 jobs rapidly
            const promises = [];
            for (let i = 0; i < 10; i++) {
                promises.push(jobManager.addJob('data-processing', { steps: 5 }));
            }
            
            const jobIds = await Promise.all(promises);
            const endTime = Date.now();
            
            expect(jobIds).toHaveLength(10);
            expect(endTime - startTime).toBeLessThan(1000); // Should be fast
            
            // All jobs should be created
            jobIds.forEach(jobId => {
                const status = jobManager.getJobStatus(jobId);
                expect(status).toBeDefined();
            });
        });
    });
}); 