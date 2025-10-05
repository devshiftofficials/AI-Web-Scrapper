import { NextRequest, NextResponse } from 'next/server';
import { checkRobotsTxt } from '../../../../utils/robotsTxt';
import { 
  validateUrl, 
  validateDepth, 
  validateMaxPages, 
  validateExtractionOptions,
  validateCustomSchema
} from '../../../../utils/validation';
import { ScrapingOptions } from '../../../../utils/jobQueue';
import { performScraping } from '../../../../utils/scraper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      url, 
      options = {},
      background = false,
      userId 
    } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate and sanitize URL
    const urlValidation = validateUrl(url);
    if (!urlValidation.isValid) {
      return NextResponse.json({ error: urlValidation.error }, { status: 400 });
    }
    const sanitizedUrl = urlValidation.sanitizedValue!;

    // Validate scraping options
    const scrapingOptions: ScrapingOptions = {
      depth: options.depth || 0,
      maxPages: options.maxPages || 1,
      respectRobots: options.respectRobots !== false, // Default to true
      extractionOptions: {
        text: options.extractionOptions?.text || false,
        links: options.extractionOptions?.links || false,
        images: options.extractionOptions?.images || false,
        metaTags: options.extractionOptions?.metaTags || false,
        tables: options.extractionOptions?.tables || false,
        structuredData: options.extractionOptions?.structuredData || false,
        customSchema: options.extractionOptions?.customSchema
      },
      crawlDelay: options.crawlDelay,
      userAgent: options.userAgent
    };

    // Validate depth
    const depthValidation = validateDepth(scrapingOptions.depth);
    if (!depthValidation.isValid) {
      return NextResponse.json({ error: depthValidation.error }, { status: 400 });
    }

    // Validate max pages
    const maxPagesValidation = validateMaxPages(scrapingOptions.maxPages);
    if (!maxPagesValidation.isValid) {
      return NextResponse.json({ error: maxPagesValidation.error }, { status: 400 });
    }

    // Validate extraction options
    const extractionValidation = validateExtractionOptions(scrapingOptions.extractionOptions);
    if (!extractionValidation.isValid) {
      return NextResponse.json({ error: extractionValidation.error }, { status: 400 });
    }

    // Validate custom schema if provided
    if (scrapingOptions.extractionOptions.customSchema) {
      const schemaValidation = validateCustomSchema(scrapingOptions.extractionOptions.customSchema);
      if (!schemaValidation.isValid) {
        return NextResponse.json({ error: schemaValidation.error }, { status: 400 });
      }
    }

    // Check robots.txt if required
    if (scrapingOptions.respectRobots) {
      const robotsResult = await checkRobotsTxt(sanitizedUrl);
      if (!robotsResult.canCrawl) {
        return NextResponse.json({ 
          error: 'Crawling is not allowed by robots.txt. You can override this by setting respectRobots to false.',
          robotsTxt: robotsResult
        }, { status: 403 });
      }
      
      // Apply crawl delay if specified
      if (robotsResult.crawlDelay && robotsResult.crawlDelay > 0) {
        scrapingOptions.crawlDelay = robotsResult.crawlDelay;
      }
    }

    // If background processing is requested, add to job queue
    if (background) {
      const { jobQueue } = await import('../../../../utils/jobQueue');
      const jobId = await jobQueue.addJob(sanitizedUrl, scrapingOptions, userId);
      
      return NextResponse.json({ 
        jobId,
        message: 'Scraping job started in background',
        statusUrl: `/api/scraper/status/${jobId}`
      });
    }

    // Perform the actual scraping
    const result = await performScraping(sanitizedUrl, scrapingOptions);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Scraping error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to analyze website';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('Navigation timeout')) {
        errorMessage = 'Website took too long to load. Please try again.';
        statusCode = 408;
      } else if (error.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
        errorMessage = 'Website not found. Please check the URL.';
        statusCode = 404;
      } else if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
        errorMessage = 'Cannot connect to website. Please check the URL.';
        statusCode = 503;
      } else if (error.message.includes('Protocol error')) {
        errorMessage = 'Website blocked the request. Please try a different website.';
        statusCode = 403;
      } else {
        errorMessage = `Analysis failed: ${error.message}`;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}