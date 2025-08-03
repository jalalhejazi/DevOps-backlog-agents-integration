const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const fs = require('fs').promises;
const path = require('path');

class BackgroundJobManager {
    constructor() {
        this.jobs = new Map();
        this.workers = new Map();
        this.jobQueue = [];
        this.isProcessing = false;
        this.maxConcurrentJobs = 3;
        this.activeJobs = 0;
    }

    // Add a new job to the queue
    async addJob(jobType, data, options = {}) {
        const jobId = this.generateJobId();
        const job = {
            id: jobId,
            type: jobType,
            data: data,
            status: 'pending',
            createdAt: new Date(),
            startedAt: null,
            completedAt: null,
            result: null,
            error: null,
            progress: 0,
            options: {
                timeout: 300000, // 5 minutes default
                retries: 3,
                ...options
            }
        };

        this.jobs.set(jobId, job);
        this.jobQueue.push(jobId);
        
        console.log(`Job ${jobId} added to queue. Type: ${jobType}`);
        
        // Start processing if not already running
        if (!this.isProcessing) {
            this.processQueue();
        }

        return jobId;
    }

    // Process the job queue
    async processQueue() {
        if (this.isProcessing || this.activeJobs >= this.maxConcurrentJobs) {
            return;
        }

        this.isProcessing = true;

        while (this.jobQueue.length > 0 && this.activeJobs < this.maxConcurrentJobs) {
            const jobId = this.jobQueue.shift();
            const job = this.jobs.get(jobId);
            
            if (job && job.status === 'pending') {
                this.activeJobs++;
                this.executeJob(job);
            }
        }

        this.isProcessing = false;
    }

    // Execute a specific job
    async executeJob(job) {
        try {
            job.status = 'running';
            job.startedAt = new Date();
            
            console.log(`Starting job ${job.id} (${job.type})`);

            // Create worker for the job
            const worker = new Worker(__filename, {
                workerData: { jobType: job.type, data: job.data, jobId: job.id }
            });

            this.workers.set(job.id, worker);

            // Handle worker messages
            worker.on('message', (message) => {
                if (message.type === 'progress') {
                    job.progress = message.progress;
                    console.log(`Job ${job.id} progress: ${message.progress}%`);
                } else if (message.type === 'result') {
                    job.result = message.result;
                    job.status = 'completed';
                    job.completedAt = new Date();
                    job.progress = 100;
                    console.log(`Job ${job.id} completed successfully`);
                }
            });

            // Handle worker errors
            worker.on('error', (error) => {
                job.error = error.message;
                job.status = 'failed';
                job.completedAt = new Date();
                console.error(`Job ${job.id} failed:`, error.message);
            });

            // Handle worker exit
            worker.on('exit', (code) => {
                this.workers.delete(job.id);
                this.activeJobs--;
                
                if (code !== 0 && job.status !== 'completed') {
                    job.status = 'failed';
                    job.error = `Worker exited with code ${code}`;
                }
                
                // Continue processing queue
                this.processQueue();
            });

            // Set timeout
            setTimeout(() => {
                if (job.status === 'running') {
                    worker.terminate();
                    job.status = 'timeout';
                    job.error = 'Job timed out';
                    this.activeJobs--;
                    this.processQueue();
                }
            }, job.options.timeout);

        } catch (error) {
            job.error = error.message;
            job.status = 'failed';
            job.completedAt = new Date();
            this.activeJobs--;
            console.error(`Job ${job.id} failed to start:`, error.message);
            this.processQueue();
        }
    }

    // Get job status
    getJobStatus(jobId) {
        const job = this.jobs.get(jobId);
        if (!job) {
            return null;
        }
        
        return {
            id: job.id,
            type: job.type,
            status: job.status,
            progress: job.progress,
            createdAt: job.createdAt,
            startedAt: job.startedAt,
            completedAt: job.completedAt,
            result: job.result,
            error: job.error
        };
    }

    // Get all jobs
    getAllJobs() {
        return Array.from(this.jobs.values()).map(job => this.getJobStatus(job.id));
    }

    // Cancel a job
    cancelJob(jobId) {
        const job = this.jobs.get(jobId);
        const worker = this.workers.get(jobId);
        
        if (job && job.status === 'running') {
            if (worker) {
                worker.terminate();
                this.workers.delete(jobId);
            }
            job.status = 'cancelled';
            job.completedAt = new Date();
            this.activeJobs--;
            this.processQueue();
            return true;
        }
        
        return false;
    }

    // Clean up completed jobs
    cleanupJobs(olderThanHours = 24) {
        const cutoff = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));
        let cleaned = 0;
        
        for (const [jobId, job] of this.jobs.entries()) {
            if (job.completedAt && job.completedAt < cutoff) {
                this.jobs.delete(jobId);
                cleaned++;
            }
        }
        
        console.log(`Cleaned up ${cleaned} old jobs`);
        return cleaned;
    }

    generateJobId() {
        return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Worker thread code
if (!isMainThread) {
    const { jobType, data, jobId } = workerData;
    
    // Simulate different types of long-running jobs
    async function executeJob() {
        try {
            switch (jobType) {
                case 'data-processing':
                    await simulateDataProcessing(data);
                    break;
                case 'file-operation':
                    await simulateFileOperation(data);
                    break;
                case 'api-call':
                    await simulateApiCall(data);
                    break;
                case 'backup':
                    await simulateBackup(data);
                    break;
                default:
                    throw new Error(`Unknown job type: ${jobType}`);
            }
            
            parentPort.postMessage({ type: 'result', result: 'Job completed successfully' });
        } catch (error) {
            parentPort.postMessage({ type: 'error', error: error.message });
        }
    }

    // Simulate data processing job
    async function simulateDataProcessing(data) {
        const totalSteps = data.steps || 100;
        
        for (let i = 0; i < totalSteps; i++) {
            // Simulate work
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Report progress
            const progress = Math.round((i + 1) / totalSteps * 100);
            parentPort.postMessage({ type: 'progress', progress });
        }
    }

    // Simulate file operation job
    async function simulateFileOperation(data) {
        const files = data.files || 10;
        
        for (let i = 0; i < files; i++) {
            // Simulate file processing
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const progress = Math.round((i + 1) / files * 100);
            parentPort.postMessage({ type: 'progress', progress });
        }
    }

    // Simulate API call job
    async function simulateApiCall(data) {
        const calls = data.calls || 5;
        
        for (let i = 0; i < calls; i++) {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const progress = Math.round((i + 1) / calls * 100);
            parentPort.postMessage({ type: 'progress', progress });
        }
    }

    // Simulate backup job
    async function simulateBackup(data) {
        const size = data.size || 100; // MB
        
        for (let i = 0; i < size; i++) {
            // Simulate backup progress
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const progress = Math.round((i + 1) / size * 100);
            parentPort.postMessage({ type: 'progress', progress });
        }
    }

    executeJob();
}

module.exports = BackgroundJobManager; 