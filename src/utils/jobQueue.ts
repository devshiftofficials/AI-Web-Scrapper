// Job queue system for background processing
export interface ScrapingJob {
  id: string;
  url: string;
  options: ScrapingOptions;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: any;
  error?: string;
  userId?: string;
}

export interface ScrapingOptions {
  depth: number;
  maxPages: number;
  respectRobots: boolean;
  extractionOptions: {
    text: boolean;
    links: boolean;
    images: boolean;
    metaTags: boolean;
    tables: boolean;
    structuredData: boolean;
    customSchema?: Record<string, string>;
  };
  crawlDelay?: number;
  userAgent?: string;
}

export interface ScrapingResult {
  url: string;
  title: string;
  description: string;
  technologies: string[];
  languages: string[];
  performance: {
    loadTime: number;
    score: number;
    metrics: {
      firstPaint: number;
      firstContentfulPaint: number;
      domContentLoaded: number;
      loadComplete: number;
    };
  };
  seo: {
    score: number;
    issues: string[];
    improvements: string[];
  };
  recommendations: string[];
  aiInsights: {
    sentiment: string;
    complexity: string;
    accessibility: string;
    security: string;
  };
  extractedData?: {
    text?: string;
    links?: Array<{ url: string; text: string; }>;
    images?: Array<{ src: string; alt: string; }>;
    metaTags?: Record<string, string>;
    tables?: Array<{ headers: string[]; rows: string[][]; }>;
    structuredData?: any;
    customData?: Record<string, any>;
  };
  analyzedAt: string;
}

class JobQueue {
  private jobs: Map<string, ScrapingJob> = new Map();
  private isProcessing = false;
  private maxConcurrentJobs = 3;
  private activeJobs = 0;

  async addJob(url: string, options: ScrapingOptions, userId?: string): Promise<string> {
    const jobId = this.generateJobId();
    const job: ScrapingJob = {
      id: jobId,
      url,
      options,
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString(),
      userId
    };

    this.jobs.set(jobId, job);
    
    // Start processing if not already running
    if (!this.isProcessing) {
      this.processJobs();
    }

    return jobId;
  }

  getJob(jobId: string): ScrapingJob | undefined {
    return this.jobs.get(jobId);
  }

  getAllJobs(userId?: string): ScrapingJob[] {
    const allJobs = Array.from(this.jobs.values());
    if (userId) {
      return allJobs.filter(job => job.userId === userId);
    }
    return allJobs;
  }

  deleteJob(jobId: string): boolean {
    return this.jobs.delete(jobId);
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async processJobs(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;

    while (this.activeJobs < this.maxConcurrentJobs) {
      const pendingJob = this.getNextPendingJob();
      if (!pendingJob) break;

      this.activeJobs++;
      this.processJob(pendingJob).finally(() => {
        this.activeJobs--;
      });
    }

    this.isProcessing = false;
  }

  private getNextPendingJob(): ScrapingJob | undefined {
    const jobs = Array.from(this.jobs.values());
    return jobs.find(job => job.status === 'pending');
  }

  private async processJob(job: ScrapingJob): Promise<void> {
    try {
      job.status = 'running';
      job.startedAt = new Date().toISOString();
      job.progress = 10;

      // Import the scraping function dynamically to avoid circular dependencies
      const { performScraping } = await import('../app/api/scraper/analyze/route');
      
      job.progress = 30;
      
      const result = await performScraping(job.url, job.options);
      
      job.progress = 90;
      job.result = result;
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      job.progress = 100;

    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error occurred';
      job.completedAt = new Date().toISOString();
    }

    // Continue processing other jobs
    setTimeout(() => this.processJobs(), 1000);
  }

  // Clean up old completed jobs (older than 24 hours)
  cleanupOldJobs(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    for (const [jobId, job] of this.jobs.entries()) {
      if (
        (job.status === 'completed' || job.status === 'failed') &&
        job.completedAt &&
        job.completedAt < cutoffTime
      ) {
        this.jobs.delete(jobId);
      }
    }
  }
}

// Singleton instance
export const jobQueue = new JobQueue();

// Cleanup old jobs every hour
setInterval(() => {
  jobQueue.cleanupOldJobs();
}, 60 * 60 * 1000);
