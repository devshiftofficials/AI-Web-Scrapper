import { NextRequest, NextResponse } from 'next/server';
import { monitoringService } from '@/utils/monitoringService';
import { validateUrl } from '@/utils/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      url, 
      name,
      userId,
      checkInterval = 60, // Default 60 minutes
      selectors = [],
      notifications = { enabled: false }
    } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: 'Monitoring job name is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Validate URL
    const urlValidation = validateUrl(url);
    if (!urlValidation.isValid) {
      return NextResponse.json({ error: urlValidation.error }, { status: 400 });
    }

    // Validate check interval
    if (checkInterval < 5 || checkInterval > 1440) { // 5 minutes to 24 hours
      return NextResponse.json({ 
        error: 'Check interval must be between 5 minutes and 24 hours' 
      }, { status: 400 });
    }

    // Validate selectors
    if (!Array.isArray(selectors) || selectors.length === 0) {
      return NextResponse.json({ 
        error: 'At least one CSS selector is required' 
      }, { status: 400 });
    }

    // Validate selector format (basic validation)
    for (const selector of selectors) {
      if (typeof selector !== 'string' || selector.trim() === '') {
        return NextResponse.json({ 
          error: 'All selectors must be non-empty strings' 
        }, { status: 400 });
      }
    }

    const jobId = await monitoringService.addMonitoringJob({
      url: urlValidation.sanitizedValue!,
      name,
      userId,
      isActive: true,
      checkInterval,
      selectors,
      notifications
    });

    return NextResponse.json({
      jobId,
      message: 'Monitoring job created successfully',
      statusUrl: `/api/monitoring/status/${jobId}`
    });

  } catch (error) {
    console.error('Error creating monitoring job:', error);
    return NextResponse.json(
      { error: 'Failed to create monitoring job' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    const jobs = monitoringService.getAllMonitoringJobs(userId || undefined);
    
    return NextResponse.json({
      jobs,
      total: jobs.length,
      active: jobs.filter(job => job.isActive).length,
      inactive: jobs.filter(job => !job.isActive).length
    });

  } catch (error) {
    console.error('Error fetching monitoring jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monitoring jobs' },
      { status: 500 }
    );
  }
}
