# Background Job System for Cursor Ultra

## 🎯 Overview

This background job system allows you to execute long-running tasks efficiently using your Cursor Ultra subscription. It provides a robust, scalable solution for handling computationally intensive operations, API calls, file processing, and other time-consuming tasks.

## 🚀 Features

- **Multi-threaded Processing**: Uses Node.js Worker Threads for true parallel execution
- **Job Queue Management**: Automatic queuing and scheduling of jobs
- **Real-time Monitoring**: Live progress tracking and status updates
- **Error Handling**: Comprehensive error handling with retry mechanisms
- **Resource Management**: Configurable concurrency limits and timeouts
- **CLI Interface**: Easy-to-use command-line interface for job management
- **Persistent Storage**: Job history and status tracking

## 📋 Supported Job Types

### 1. Data Processing (`data-processing`)
- **Purpose**: Heavy computational tasks, data analysis, machine learning preprocessing
- **Parameters**: `steps` (number of processing steps)
- **Example**: `{"steps": 100}`

### 2. File Operations (`file-operation`)
- **Purpose**: File processing, batch operations, data import/export
- **Parameters**: `files` (number of files to process)
- **Example**: `{"files": 50}`

### 3. API Calls (`api-call`)
- **Purpose**: External API integration, web scraping, data fetching
- **Parameters**: `calls` (number of API calls to make)
- **Example**: `{"calls": 20}`

### 4. Backup Operations (`backup`)
- **Purpose**: Data backup, system maintenance, archival tasks
- **Parameters**: `size` (backup size in MB)
- **Example**: `{"size": 500}`

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 14+ (already included in your project)
- Cursor Ultra subscription (✅ You have this!)

### Quick Start

1. **Navigate to the webapp directory**:
   ```bash
   cd webapp
   ```

2. **Start the job manager CLI**:
   ```bash
   npm run jobs
   ```

3. **Add demo jobs** (optional):
   ```bash
   npm run jobs:demo
   ```

## 📖 Usage Guide

### Command Line Interface

Start the interactive CLI:
```bash
npm run jobs
```

#### Available Commands

| Command | Description | Example |
|---------|-------------|---------|
| `help` | Show help information | `help` |
| `add <type> <data>` | Add a new job | `add data-processing '{"steps": 50}'` |
| `status <jobId>` | Check job status | `status job_1234567890_abc123` |
| `list` | List all jobs | `list` |
| `cancel <jobId>` | Cancel a running job | `cancel job_1234567890_abc123` |
| `cleanup [hours]` | Clean up old jobs | `cleanup 24` |
| `monitor` | Real-time job monitoring | `monitor` |
| `exit` | Exit the CLI | `exit` |

### Programmatic Usage

```javascript
const BackgroundJobManager = require('./background-jobs');

// Create job manager instance
const jobManager = new BackgroundJobManager();

// Add a data processing job
const jobId = await jobManager.addJob('data-processing', {
    steps: 100
}, {
    timeout: 300000, // 5 minutes
    retries: 3
});

// Check job status
const status = jobManager.getJobStatus(jobId);
console.log(`Job ${jobId} status: ${status.status}`);

// Monitor progress
setInterval(() => {
    const status = jobManager.getJobStatus(jobId);
    console.log(`Progress: ${status.progress}%`);
}, 1000);
```

## 🔧 Configuration

### Job Manager Settings

```javascript
const jobManager = new BackgroundJobManager({
    maxConcurrentJobs: 3,    // Maximum parallel jobs
    defaultTimeout: 300000,  // 5 minutes default timeout
    defaultRetries: 3        // Default retry attempts
});
```

### Job Options

```javascript
await jobManager.addJob('data-processing', data, {
    timeout: 600000,  // 10 minutes
    retries: 5,       // 5 retry attempts
    priority: 'high'  // Job priority (future feature)
});
```

## 📊 Monitoring & Observability

### Real-time Monitoring

Use the `monitor` command for live job tracking:
```bash
npm run jobs
job-manager> monitor
```

### Job Status Tracking

Each job tracks:
- **Status**: pending, running, completed, failed, cancelled, timeout
- **Progress**: 0-100% completion
- **Timestamps**: created, started, completed
- **Results**: success output or error messages
- **Duration**: execution time

### Logging

The system provides comprehensive logging:
- Job creation and scheduling
- Progress updates
- Error conditions
- Performance metrics

## 🔄 Integration with Cursor Ultra

### AI-Assisted Job Creation

With Cursor Ultra, you can:

1. **Generate Job Scripts**: Ask AI to create custom job types
2. **Optimize Performance**: Get suggestions for job optimization
3. **Debug Issues**: AI assistance with troubleshooting
4. **Scale Operations**: Get recommendations for scaling job processing

### Example AI Prompts

```
"Create a custom job type for image processing that handles batch resizing"
"Optimize the data-processing job for better memory usage"
"Add error handling for network timeouts in API calls"
"Create a job scheduler that runs jobs at specific times"
```

## 🚀 Advanced Features

### Custom Job Types

Extend the system with your own job types:

```javascript
// In background-jobs.js, add to the executeJob function:
case 'custom-job':
    await executeCustomJob(data);
    break;

async function executeCustomJob(data) {
    // Your custom job logic here
    for (let i = 0; i < data.iterations; i++) {
        // Do work
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Report progress
        const progress = Math.round((i + 1) / data.iterations * 100);
        parentPort.postMessage({ type: 'progress', progress });
    }
}
```

### Persistent Storage

For production use, consider adding database persistence:

```javascript
// Example with SQLite
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('jobs.db');

// Save job to database
db.run('INSERT INTO jobs (id, type, status, data) VALUES (?, ?, ?, ?)',
    [jobId, jobType, 'pending', JSON.stringify(data)]);
```

### Web Interface

Create a web dashboard for job monitoring:

```javascript
// Express.js endpoint example
app.get('/api/jobs', (req, res) => {
    const jobs = jobManager.getAllJobs();
    res.json(jobs);
});

app.post('/api/jobs', (req, res) => {
    const { type, data } = req.body;
    const jobId = jobManager.addJob(type, data);
    res.json({ jobId });
});
```

## 🔒 Security Considerations

- **Input Validation**: All job data is validated before execution
- **Resource Limits**: Configurable timeouts prevent runaway jobs
- **Error Isolation**: Failed jobs don't affect other running jobs
- **Access Control**: Consider adding authentication for production use

## 📈 Performance Optimization

### Best Practices

1. **Batch Processing**: Group similar operations into single jobs
2. **Resource Monitoring**: Monitor CPU and memory usage
3. **Concurrency Tuning**: Adjust `maxConcurrentJobs` based on system resources
4. **Timeout Management**: Set appropriate timeouts for different job types

### Scaling Strategies

- **Horizontal Scaling**: Run multiple job manager instances
- **Load Balancing**: Distribute jobs across multiple servers
- **Database Sharding**: Partition job storage for high-volume scenarios
- **Caching**: Cache frequently accessed job results

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
# Test job execution
npm run test:integration

# Test CLI interface
npm run test:cli
```

### Load Testing

```bash
# Simulate high job volume
npm run test:load
```

## 🐛 Troubleshooting

### Common Issues

1. **Jobs not starting**: Check if maxConcurrentJobs limit is reached
2. **Jobs timing out**: Increase timeout value or optimize job logic
3. **Memory issues**: Reduce concurrent jobs or add memory monitoring
4. **Worker crashes**: Check for unhandled exceptions in job code

### Debug Mode

Enable debug logging:
```bash
DEBUG=job-manager npm run jobs
```

## 📚 Examples

### Complete Workflow Example

```bash
# 1. Start job manager
npm run jobs

# 2. Add multiple jobs
job-manager> add data-processing '{"steps": 100}'
job-manager> add file-operation '{"files": 50}'
job-manager> add api-call '{"calls": 20}'

# 3. Monitor progress
job-manager> monitor

# 4. Check specific job
job-manager> status job_1234567890_abc123

# 5. Clean up old jobs
job-manager> cleanup 24
```

### Integration with Your Project

This background job system integrates seamlessly with your existing backlog.md CLI tool workflow:

1. **Task Creation**: Create tasks for long-running operations
2. **Job Execution**: Use background jobs to handle the heavy lifting
3. **Progress Tracking**: Monitor job progress and update task status
4. **Completion**: Mark tasks as done when jobs complete

## 🎉 Conclusion

This background job system provides a powerful foundation for executing long-running tasks with your Cursor Ultra subscription. It's designed to be:

- **Scalable**: Handle from small to large job volumes
- **Reliable**: Robust error handling and recovery
- **Observable**: Comprehensive monitoring and logging
- **Extensible**: Easy to add custom job types
- **User-friendly**: Simple CLI interface

Start with the basic CLI interface and gradually extend the system as your needs grow. The AI capabilities in Cursor Ultra will help you optimize and enhance the system over time. 