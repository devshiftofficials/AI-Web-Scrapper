// Monitoring service for content change detection
export interface MonitoringJob {
  id: string;
  url: string;
  name: string;
  userId: string;
  isActive: boolean;
  createdAt: string;
  lastChecked?: string;
  lastChange?: string;
  checkInterval: number; // in minutes
  selectors: string[]; // CSS selectors to monitor
  previousContent: Record<string, string>; // selector -> content hash
  notifications: {
    email?: string;
    webhook?: string;
    enabled: boolean;
  };
  changeHistory: Array<{
    timestamp: string;
    selector: string;
    changeType: 'added' | 'removed' | 'modified';
    oldContent?: string;
    newContent?: string;
  }>;
}

export interface MonitoringResult {
  hasChanges: boolean;
  changes: Array<{
    selector: string;
    changeType: 'added' | 'removed' | 'modified';
    oldContent?: string;
    newContent?: string;
  }>;
  checkedAt: string;
}

class MonitoringService {
  private monitoringJobs: Map<string, MonitoringJob> = new Map();
  private activeIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  async addMonitoringJob(job: Omit<MonitoringJob, 'id' | 'createdAt' | 'previousContent' | 'changeHistory'>): Promise<string> {
    const jobId = this.generateJobId();
    const monitoringJob: MonitoringJob = {
      ...job,
      id: jobId,
      createdAt: new Date().toISOString(),
      previousContent: {},
      changeHistory: []
    };

    this.monitoringJobs.set(jobId, monitoringJob);
    
    // Start monitoring if job is active
    if (monitoringJob.isActive) {
      this.startMonitoring(jobId);
    }

    return jobId;
  }

  async updateMonitoringJob(jobId: string, updates: Partial<MonitoringJob>): Promise<boolean> {
    const job = this.monitoringJobs.get(jobId);
    if (!job) return false;

    const updatedJob = { ...job, ...updates };
    this.monitoringJobs.set(jobId, updatedJob);

    // Restart monitoring if interval changed or active status changed
    if (updates.checkInterval || updates.isActive !== undefined) {
      this.stopMonitoring(jobId);
      if (updatedJob.isActive) {
        this.startMonitoring(jobId);
      }
    }

    return true;
  }

  async removeMonitoringJob(jobId: string): Promise<boolean> {
    this.stopMonitoring(jobId);
    return this.monitoringJobs.delete(jobId);
  }

  getMonitoringJob(jobId: string): MonitoringJob | undefined {
    return this.monitoringJobs.get(jobId);
  }

  getAllMonitoringJobs(userId?: string): MonitoringJob[] {
    const jobs = Array.from(this.monitoringJobs.values());
    if (userId) {
      return jobs.filter(job => job.userId === userId);
    }
    return jobs;
  }

  async startMonitoring(jobId: string): Promise<void> {
    const job = this.monitoringJobs.get(jobId);
    if (!job || !job.isActive) return;

    // Stop existing monitoring for this job
    this.stopMonitoring(jobId);

    // Start new monitoring interval
    const interval = setInterval(async () => {
      try {
        await this.checkForChanges(jobId);
      } catch (error) {
        console.error(`Error checking changes for job ${jobId}:`, error);
      }
    }, job.checkInterval * 60 * 1000); // Convert minutes to milliseconds

    this.activeIntervals.set(jobId, interval);

    // Perform initial check
    await this.checkForChanges(jobId);
  }

  async stopMonitoring(jobId: string): Promise<void> {
    const interval = this.activeIntervals.get(jobId);
    if (interval) {
      clearInterval(interval);
      this.activeIntervals.delete(jobId);
    }
  }

  async checkForChanges(jobId: string): Promise<MonitoringResult> {
    const job = this.monitoringJobs.get(jobId);
    if (!job) {
      throw new Error('Monitoring job not found');
    }

    try {
      // Fetch current content
      const response = await fetch(job.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const content = await response.text();
      const { extractContentFromSelectors } = await import('./contentExtractor');
      
      // Extract content from monitored selectors
      const currentContent = await extractContentFromSelectors(content, job.selectors);
      
      // Compare with previous content
      const changes = this.detectChanges(job.previousContent, currentContent);
      
      // Update job with new content and changes
      job.previousContent = currentContent;
      job.lastChecked = new Date().toISOString();
      
      if (changes.length > 0) {
        job.lastChange = new Date().toISOString();
        
        // Add changes to history
        changes.forEach(change => {
          job.changeHistory.push({
            timestamp: new Date().toISOString(),
            ...change
          });
        });

        // Keep only last 50 changes
        if (job.changeHistory.length > 50) {
          job.changeHistory = job.changeHistory.slice(-50);
        }

        // Send notifications if enabled
        if (job.notifications.enabled) {
          await this.sendNotifications(job, changes);
        }
      }

      this.monitoringJobs.set(jobId, job);

      return {
        hasChanges: changes.length > 0,
        changes,
        checkedAt: job.lastChecked
      };

    } catch (error) {
      console.error(`Error checking changes for job ${jobId}:`, error);
      throw error;
    }
  }

  private detectChanges(previousContent: Record<string, string>, currentContent: Record<string, string>): Array<{
    selector: string;
    changeType: 'added' | 'removed' | 'modified';
    oldContent?: string;
    newContent?: string;
  }> {
    const changes: Array<{
      selector: string;
      changeType: 'added' | 'removed' | 'modified';
      oldContent?: string;
      newContent?: string;
    }> = [];

    // Check for new selectors
    for (const [selector, content] of Object.entries(currentContent)) {
      if (!previousContent[selector]) {
        changes.push({
          selector,
          changeType: 'added',
          newContent: content
        });
      } else if (previousContent[selector] !== content) {
        changes.push({
          selector,
          changeType: 'modified',
          oldContent: previousContent[selector],
          newContent: content
        });
      }
    }

    // Check for removed selectors
    for (const [selector, content] of Object.entries(previousContent)) {
      if (!currentContent[selector]) {
        changes.push({
          selector,
          changeType: 'removed',
          oldContent: content
        });
      }
    }

    return changes;
  }

  private async sendNotifications(job: MonitoringJob, changes: Array<{
    selector: string;
    changeType: 'added' | 'removed' | 'modified';
    oldContent?: string;
    newContent?: string;
  }>): Promise<void> {
    const notificationData = {
      jobId: job.id,
      jobName: job.name,
      url: job.url,
      changes,
      timestamp: new Date().toISOString()
    };

    // Send webhook notification
    if (job.notifications.webhook) {
      try {
        await fetch(job.notifications.webhook, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(notificationData)
        });
      } catch (error) {
        console.error('Failed to send webhook notification:', error);
      }
    }

    // Send email notification (placeholder - would need email service)
    if (job.notifications.email) {
      console.log('Email notification would be sent to:', job.notifications.email);
      console.log('Notification data:', notificationData);
    }
  }

  private generateJobId(): string {
    return `monitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup method to stop all monitoring
  cleanup(): void {
    for (const [jobId] of this.activeIntervals) {
      this.stopMonitoring(jobId);
    }
    this.activeIntervals.clear();
  }
}

// Singleton instance
export const monitoringService = new MonitoringService();

// Cleanup on process exit
process.on('SIGINT', () => {
  monitoringService.cleanup();
});

process.on('SIGTERM', () => {
  monitoringService.cleanup();
});
