#!/usr/bin/env node

const BackgroundJobManager = require('./background-jobs');
const readline = require('readline');

class JobCLI {
    constructor() {
        this.jobManager = new BackgroundJobManager();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async start() {
        console.log('🚀 Background Job Manager CLI');
        console.log('Type "help" for available commands\n');

        this.showPrompt();
    }

    showPrompt() {
        this.rl.question('job-manager> ', async (input) => {
            await this.processCommand(input.trim());
            this.showPrompt();
        });
    }

    async processCommand(input) {
        const parts = input.split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);

        try {
            switch (command) {
                case 'help':
                    this.showHelp();
                    break;
                case 'add':
                    await this.addJob(args);
                    break;
                case 'status':
                    await this.showJobStatus(args);
                    break;
                case 'list':
                    await this.listJobs();
                    break;
                case 'cancel':
                    await this.cancelJob(args);
                    break;
                case 'cleanup':
                    await this.cleanupJobs(args);
                    break;
                case 'monitor':
                    await this.monitorJobs();
                    break;
                case 'exit':
                case 'quit':
                    console.log('Goodbye!');
                    this.rl.close();
                    process.exit(0);
                    break;
                default:
                    console.log(`Unknown command: ${command}. Type "help" for available commands.`);
            }
        } catch (error) {
            console.error('Error:', error.message);
        }
    }

    showHelp() {
        console.log('\n📋 Available Commands:');
        console.log('  add <type> <data>     - Add a new job (types: data-processing, file-operation, api-call, backup)');
        console.log('  status <jobId>        - Show status of a specific job');
        console.log('  list                  - List all jobs');
        console.log('  cancel <jobId>        - Cancel a running job');
        console.log('  cleanup [hours]       - Clean up completed jobs older than hours (default: 24)');
        console.log('  monitor               - Monitor jobs in real-time');
        console.log('  help                  - Show this help message');
        console.log('  exit/quit             - Exit the CLI');
        console.log('\n📝 Examples:');
        console.log('  add data-processing "{\\"steps\\": 50}"');
        console.log('  add file-operation "{\\"files\\": 20}"');
        console.log('  add api-call "{\\"calls\\": 10}"');
        console.log('  add backup "{\\"size\\": 200}"');
        console.log('  status job_1234567890_abc123');
        console.log('  cleanup 48');
    }

    async addJob(args) {
        if (args.length < 2) {
            console.log('Usage: add <type> <data>');
            console.log('Types: data-processing, file-operation, api-call, backup');
            return;
        }

        const jobType = args[0];
        const dataStr = args.slice(1).join(' ');
        
        let data;
        try {
            data = JSON.parse(dataStr);
        } catch (error) {
            console.log('Invalid JSON data. Please provide valid JSON.');
            return;
        }

        const jobId = await this.jobManager.addJob(jobType, data);
        console.log(`✅ Job added with ID: ${jobId}`);
        console.log(`Type: ${jobType}`);
        console.log(`Data: ${JSON.stringify(data)}`);
    }

    async showJobStatus(args) {
        if (args.length < 1) {
            console.log('Usage: status <jobId>');
            return;
        }

        const jobId = args[0];
        const status = this.jobManager.getJobStatus(jobId);
        
        if (!status) {
            console.log(`❌ Job ${jobId} not found`);
            return;
        }

        console.log('\n📊 Job Status:');
        console.log(`ID: ${status.id}`);
        console.log(`Type: ${status.type}`);
        console.log(`Status: ${this.getStatusEmoji(status.status)} ${status.status}`);
        console.log(`Progress: ${status.progress}%`);
        console.log(`Created: ${status.createdAt.toLocaleString()}`);
        
        if (status.startedAt) {
            console.log(`Started: ${status.startedAt.toLocaleString()}`);
        }
        
        if (status.completedAt) {
            console.log(`Completed: ${status.completedAt.toLocaleString()}`);
            const duration = status.completedAt - status.startedAt;
            console.log(`Duration: ${this.formatDuration(duration)}`);
        }
        
        if (status.result) {
            console.log(`Result: ${status.result}`);
        }
        
        if (status.error) {
            console.log(`Error: ${status.error}`);
        }
    }

    async listJobs() {
        const jobs = this.jobManager.getAllJobs();
        
        if (jobs.length === 0) {
            console.log('📭 No jobs found');
            return;
        }

        console.log('\n📋 All Jobs:');
        console.log('─'.repeat(100));
        console.log(`${'ID'.padEnd(25)} ${'Type'.padEnd(20)} ${'Status'.padEnd(12)} ${'Progress'.padEnd(10)} ${'Created'}`);
        console.log('─'.repeat(100));
        
        jobs.forEach(job => {
            const statusEmoji = this.getStatusEmoji(job.status);
            const progress = job.progress ? `${job.progress}%` : '-';
            const created = job.createdAt.toLocaleString();
            
            console.log(`${job.id.padEnd(25)} ${job.type.padEnd(20)} ${(statusEmoji + ' ' + job.status).padEnd(12)} ${progress.padEnd(10)} ${created}`);
        });
        
        console.log('─'.repeat(100));
        console.log(`Total jobs: ${jobs.length}`);
    }

    async cancelJob(args) {
        if (args.length < 1) {
            console.log('Usage: cancel <jobId>');
            return;
        }

        const jobId = args[0];
        const cancelled = this.jobManager.cancelJob(jobId);
        
        if (cancelled) {
            console.log(`✅ Job ${jobId} cancelled successfully`);
        } else {
            console.log(`❌ Failed to cancel job ${jobId}. Job may not be running or doesn't exist.`);
        }
    }

    async cleanupJobs(args) {
        const hours = args.length > 0 ? parseInt(args[0]) : 24;
        
        if (isNaN(hours) || hours < 0) {
            console.log('Please provide a valid number of hours');
            return;
        }

        const cleaned = this.jobManager.cleanupJobs(hours);
        console.log(`🧹 Cleaned up ${cleaned} jobs older than ${hours} hours`);
    }

    async monitorJobs() {
        console.log('🔍 Monitoring jobs in real-time (Press Ctrl+C to stop)...\n');
        
        const interval = setInterval(() => {
            const jobs = this.jobManager.getAllJobs();
            const runningJobs = jobs.filter(job => job.status === 'running');
            const pendingJobs = jobs.filter(job => job.status === 'pending');
            const completedJobs = jobs.filter(job => job.status === 'completed');
            const failedJobs = jobs.filter(job => job.status === 'failed');
            
            console.clear();
            console.log('📊 Job Monitor - ' + new Date().toLocaleString());
            console.log('─'.repeat(60));
            console.log(`🟢 Running: ${runningJobs.length} | ⏳ Pending: ${pendingJobs.length} | ✅ Completed: ${completedJobs.length} | ❌ Failed: ${failedJobs.length}`);
            console.log('─'.repeat(60));
            
            if (runningJobs.length > 0) {
                console.log('\n🔄 Currently Running:');
                runningJobs.forEach(job => {
                    console.log(`  ${job.id} (${job.type}) - ${job.progress}%`);
                });
            }
            
            if (pendingJobs.length > 0) {
                console.log('\n⏳ Pending:');
                pendingJobs.forEach(job => {
                    console.log(`  ${job.id} (${job.type})`);
                });
            }
        }, 1000);

        // Handle Ctrl+C
        process.on('SIGINT', () => {
            clearInterval(interval);
            console.log('\n👋 Monitoring stopped');
            this.showPrompt();
        });
    }

    getStatusEmoji(status) {
        switch (status) {
            case 'pending': return '⏳';
            case 'running': return '🔄';
            case 'completed': return '✅';
            case 'failed': return '❌';
            case 'cancelled': return '🚫';
            case 'timeout': return '⏰';
            default: return '❓';
        }
    }

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
}

// Start the CLI if this file is run directly
if (require.main === module) {
    const cli = new JobCLI();
    cli.start();
}

module.exports = JobCLI; 