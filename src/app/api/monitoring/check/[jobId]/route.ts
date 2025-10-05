import { NextRequest, NextResponse } from 'next/server';
import { monitoringService } from '@/utils/monitoringService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const result = await monitoringService.checkForChanges(jobId);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error checking for changes:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: 'Monitoring job not found' }, { status: 404 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to check for changes' },
      { status: 500 }
    );
  }
}
