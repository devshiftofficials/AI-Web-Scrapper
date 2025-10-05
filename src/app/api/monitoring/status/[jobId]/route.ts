import { NextRequest, NextResponse } from 'next/server';
import { monitoringService } from '@/utils/monitoringService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const job = monitoringService.getMonitoringJob(jobId);
    
    if (!job) {
      return NextResponse.json({ error: 'Monitoring job not found' }, { status: 404 });
    }

    return NextResponse.json(job);

  } catch (error) {
    console.error('Error fetching monitoring job status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monitoring job status' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const body = await request.json();
    
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const success = await monitoringService.updateMonitoringJob(jobId, body);
    
    if (!success) {
      return NextResponse.json({ error: 'Monitoring job not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Monitoring job updated successfully' });

  } catch (error) {
    console.error('Error updating monitoring job:', error);
    return NextResponse.json(
      { error: 'Failed to update monitoring job' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const success = await monitoringService.removeMonitoringJob(jobId);
    
    if (!success) {
      return NextResponse.json({ error: 'Monitoring job not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Monitoring job deleted successfully' });

  } catch (error) {
    console.error('Error deleting monitoring job:', error);
    return NextResponse.json(
      { error: 'Failed to delete monitoring job' },
      { status: 500 }
    );
  }
}
