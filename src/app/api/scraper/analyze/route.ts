import { NextRequest, NextResponse } from 'next/server';
import puppeteer, { Page } from 'puppeteer';
import * as cheerio from 'cheerio';

// AI/ML enhanced analysis functions
interface AnalysisResult {
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
  analyzedAt: string;
}

export async function POST(request: NextRequest) {
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;
  let page: Page | null = null;
  
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Initialize browser with environment-specific settings
    const browserOptions: {
      headless: boolean;
      args: string[];
      executablePath?: string;
    } = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    };

    // Add environment-specific configurations
    if (process.env.VERCEL === '1') {
      browserOptions.executablePath = '/usr/bin/chromium-browser';
    } else if (process.env.NODE_ENV === 'development') {
      // For development, try to use system Chrome if available
      browserOptions.args.push('--single-process');
    }
    
    try {
      browser = await puppeteer.launch(browserOptions);
      page = await browser.newPage();
    } catch (puppeteerError) {
      console.error('Puppeteer launch failed:', puppeteerError);
      return NextResponse.json(
        { 
          error: 'Browser initialization failed. This might be due to system limitations. Please try again or contact support.' 
        },
        { status: 503 }
      );
    }
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Measure performance
    const startTime = Date.now();
    
    // Navigate to the page
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    const loadTime = Date.now() - startTime;
    
    // Get page content
    const content = await page.content();
    const $ = cheerio.load(content);
    
    // Extract basic information
    const title = $('title').text() || 'No title found';
    const description = $('meta[name="description"]').attr('content') || 'No description found';
    
    // Detect technologies and languages
    const technologies = detectTechnologies($, content);
    const languages = detectProgrammingLanguages($, content);
    
    // Enhanced performance analysis with AI
    const performance = await analyzePerformanceWithAI(page, loadTime);
    
    // Enhanced SEO analysis
    const seo = analyzeSEOWithAI($, content);
    
    // AI-powered insights
    const aiInsights = generateAIInsights(content, technologies, performance);
    
    // Generate intelligent recommendations
    const recommendations = generateIntelligentRecommendations(technologies, performance, seo, aiInsights);
    
    if (browser) {
      await browser.close();
    }
    
    const result: AnalysisResult = {
      url,
      title,
      description,
      technologies,
      languages,
      performance,
      seo,
      recommendations,
      aiInsights,
      analyzedAt: new Date().toISOString()
    };
    
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
    
    // Ensure browser is closed even on error
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

function detectTechnologies($: cheerio.Root, content: string): string[] {
  const technologies: string[] = [];
  
  // Framework detection
  if (content.includes('react') || content.includes('React')) technologies.push('React');
  if (content.includes('vue') || content.includes('Vue')) technologies.push('Vue.js');
  if (content.includes('angular') || content.includes('Angular')) technologies.push('Angular');
  if (content.includes('next.js') || content.includes('Next.js')) technologies.push('Next.js');
  
  // CSS frameworks
  if (content.includes('bootstrap') || content.includes('Bootstrap')) technologies.push('Bootstrap');
  if (content.includes('tailwind') || content.includes('Tailwind')) technologies.push('Tailwind CSS');
  if (content.includes('material-ui') || content.includes('Material-UI')) technologies.push('Material-UI');
  
  // Analytics
  if (content.includes('google-analytics') || content.includes('gtag')) technologies.push('Google Analytics');
  if (content.includes('mixpanel')) technologies.push('Mixpanel');
  if (content.includes('hotjar')) technologies.push('Hotjar');
  
  // CDNs
  if (content.includes('cloudflare')) technologies.push('Cloudflare');
  if (content.includes('aws')) technologies.push('AWS');
  
  // CMS
  if (content.includes('wordpress') || content.includes('wp-content')) technologies.push('WordPress');
  if (content.includes('drupal')) technologies.push('Drupal');
  
  return [...new Set(technologies)]; // Remove duplicates
}


// Enhanced programming language detection
function detectProgrammingLanguages($: cheerio.Root, content: string): string[] {
  const languages: string[] = [];
  
  // JavaScript detection
  if (content.includes('function') || content.includes('var ') || content.includes('const ') || content.includes('let ')) {
    languages.push('JavaScript');
  }
  
  // TypeScript detection
  if (content.includes('interface ') || content.includes('type ') || content.includes(': string') || content.includes(': number')) {
    languages.push('TypeScript');
  }
  
  // Python detection (server-side)
  if (content.includes('import ') && content.includes('def ') || content.includes('python')) {
    languages.push('Python');
  }
  
  // PHP detection
  if (content.includes('<?php') || content.includes('$_GET') || content.includes('$_POST')) {
    languages.push('PHP');
  }
  
  // Java detection
  if (content.includes('public class') || content.includes('import java')) {
    languages.push('Java');
  }
  
  // C# detection
  if (content.includes('using System') || content.includes('namespace ') || content.includes('public class')) {
    languages.push('C#');
  }
  
  // Ruby detection
  if (content.includes('def ') && content.includes('end') || content.includes('require ')) {
    languages.push('Ruby');
  }
  
  // Go detection
  if (content.includes('package main') || content.includes('func main()')) {
    languages.push('Go');
  }
  
  // Rust detection
  if (content.includes('fn main()') || content.includes('use std::')) {
    languages.push('Rust');
  }
  
  return [...new Set(languages)]; // Remove duplicates
}

// AI-enhanced performance analysis
async function analyzePerformanceWithAI(page: Page, loadTime: number): Promise<{
  loadTime: number;
  score: number;
  metrics: {
    firstPaint: number;
    firstContentfulPaint: number;
    domContentLoaded: number;
    loadComplete: number;
  };
}> {
  try {
    // Get comprehensive performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType('paint');
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
        totalBlockingTime: navigation.loadEventEnd - navigation.domContentLoadedEventEnd,
        largestContentfulPaint: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime || 0
      };
    });
    
    // AI-powered performance scoring algorithm
    let score = 100;
    const deductions = [];
    
    // Load time analysis
    if (loadTime > 5000) {
      score -= 30;
      deductions.push('Very slow load time (>5s)');
    } else if (loadTime > 3000) {
      score -= 20;
      deductions.push('Slow load time (>3s)');
    } else if (loadTime > 2000) {
      score -= 10;
      deductions.push('Moderate load time (>2s)');
    }
    
    // First Contentful Paint analysis
    if (metrics.firstContentfulPaint > 2500) {
      score -= 25;
      deductions.push('Poor First Contentful Paint (>2.5s)');
    } else if (metrics.firstContentfulPaint > 1800) {
      score -= 15;
      deductions.push('Slow First Contentful Paint (>1.8s)');
    }
    
    // DOM Content Loaded analysis
    if (metrics.domContentLoaded > 2000) {
      score -= 20;
      deductions.push('Slow DOM Content Loaded (>2s)');
    }
    
    // Total Blocking Time analysis
    if (metrics.totalBlockingTime > 300) {
      score -= 15;
      deductions.push('High Total Blocking Time (>300ms)');
    }
    
    return {
      loadTime,
      score: Math.max(0, score),
      metrics: {
        firstPaint: metrics.firstPaint,
        firstContentfulPaint: metrics.firstContentfulPaint,
        domContentLoaded: metrics.domContentLoaded,
        loadComplete: metrics.loadComplete
      }
    };
  } catch (error) {
    console.error('Performance analysis error:', error);
    return {
      loadTime,
      score: Math.max(0, 100 - Math.floor(loadTime / 100)),
      metrics: {
        firstPaint: 0,
        firstContentfulPaint: 0,
        domContentLoaded: 0,
        loadComplete: 0
      }
    };
  }
}

// AI-enhanced SEO analysis
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function analyzeSEOWithAI($: cheerio.Root, content: string): {
  score: number;
  issues: string[];
  improvements: string[];
} {
  const issues: string[] = [];
  const improvements: string[] = [];
  let score = 100;
  
  // Enhanced title analysis
  const title = $('title').text();
  if (!title) {
    issues.push('Missing title tag');
    score -= 25;
  } else {
    if (title.length < 30) {
      issues.push('Title too short (should be 30-60 characters)');
      score -= 10;
    } else if (title.length > 60) {
      issues.push('Title too long (should be 30-60 characters)');
      score -= 5;
    }
    
    // AI-powered title analysis
    if (!title.includes('|') && !title.includes('-') && title.length > 40) {
      improvements.push('Consider adding brand separator (| or -) to title');
    }
  }
  
  // Enhanced meta description analysis
  const description = $('meta[name="description"]').attr('content');
  if (!description) {
    issues.push('Missing meta description');
    score -= 20;
  } else {
    if (description.length < 120) {
      issues.push('Meta description too short (should be 120-160 characters)');
      score -= 8;
    } else if (description.length > 160) {
      issues.push('Meta description too long (should be 120-160 characters)');
      score -= 5;
    }
    
    // AI-powered description analysis
    if (!description.includes('.')) {
      improvements.push('Consider adding a call-to-action in meta description');
    }
  }
  
  // Enhanced heading structure analysis
  const h1Count = $('h1').length;
  const h2Count = $('h2').length;
  
  if (h1Count === 0) {
    issues.push('Missing H1 heading');
    score -= 15;
  } else if (h1Count > 1) {
    issues.push('Multiple H1 headings found');
    score -= 8;
  }
  
  if (h2Count === 0 && h1Count > 0) {
    improvements.push('Consider adding H2 headings for better content structure');
  }
  
  // Enhanced image analysis
  const images = $('img');
  const imagesWithoutAlt = images.filter((_, el) => !$(el).attr('alt') || $(el).attr('alt') === '').length;
  const totalImages = images.length;
  
  if (imagesWithoutAlt > 0) {
    issues.push(`${imagesWithoutAlt} images missing alt text`);
    score -= imagesWithoutAlt * 3;
  }
  
  // AI-powered image optimization suggestions
  if (totalImages > 0) {
    const imagesWithoutOptimization = images.filter((_, el) => {
      const src = $(el).attr('src');
      return Boolean(src && !src.includes('webp') && !src.includes('avif'));
    }).length;
    
    if (imagesWithoutOptimization > 0) {
      improvements.push('Consider using WebP or AVIF format for better performance');
    }
  }
  
  // Enhanced link analysis
  let internalLinks = 0;
  let externalLinks = 0;
  
  try {
    // Get all links and analyze them
    const allLinks = $('a[href]');
    allLinks.each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        if (href.startsWith('/') || href.startsWith('#')) {
          internalLinks++;
        } else if (href.startsWith('http')) {
          externalLinks++;
        }
      }
    });
  } catch (error) {
    console.warn('Error analyzing links:', error);
    internalLinks = $('a[href^="/"]').length;
    externalLinks = $('a[href^="http"]').length;
  }
  
  if (internalLinks < 3) {
    issues.push('Low number of internal links');
    score -= 10;
  }
  
  if (externalLinks === 0 && internalLinks > 5) {
    improvements.push('Consider adding external links for better authority');
  }
  
  // AI-powered content analysis
  const textContent = $('body').text();
  const wordCount = textContent.split(/\s+/).length;
  
  if (wordCount < 300) {
    issues.push('Content too short (should be at least 300 words)');
    score -= 15;
  } else if (wordCount > 2000) {
    improvements.push('Consider breaking long content into multiple pages');
  }
  
  // Schema markup detection
  if (!$('script[type="application/ld+json"]').length) {
    improvements.push('Consider adding structured data (Schema.org) markup');
  }
  
  return {
    score: Math.max(0, score),
    issues,
    improvements
  };
}

// AI-powered insights generation
function generateAIInsights(
  content: string,
  technologies: string[],
  performance: { loadTime: number; score: number }
): {
  sentiment: string;
  complexity: string;
  accessibility: string;
  security: string;
} {
  // Sentiment analysis (simplified)
  const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'best', 'love', 'perfect'];
  const negativeWords = ['bad', 'terrible', 'awful', 'worst', 'hate', 'horrible', 'poor'];
  
  const text = content.toLowerCase();
  const positiveCount = positiveWords.filter(word => text.includes(word)).length;
  const negativeCount = negativeWords.filter(word => text.includes(word)).length;
  
  let sentiment = 'Neutral';
  if (positiveCount > negativeCount + 2) sentiment = 'Positive';
  else if (negativeCount > positiveCount + 2) sentiment = 'Negative';
  
  // Complexity analysis
  let complexity = 'Simple';
  if (technologies.length > 5) complexity = 'Complex';
  else if (technologies.length > 2) complexity = 'Medium';
  
  if (performance.loadTime > 3000) complexity = 'Complex';
  
  // Accessibility analysis
  let accessibility = 'Good';
  const hasAltTexts = content.includes('alt=');
  const hasHeadings = content.includes('<h1') || content.includes('<h2');
  
  if (!hasAltTexts || !hasHeadings) accessibility = 'Needs Improvement';
  
  // Security analysis
  let security = 'Secure';
  if (content.includes('http://') && !content.includes('https://')) security = 'Insecure';
  if (content.includes('password') || content.includes('login')) security = 'Needs Review';
  
  return {
    sentiment,
    complexity,
    accessibility,
    security
  };
}

// Intelligent recommendations generation
function generateIntelligentRecommendations(
  technologies: string[],
  performance: { loadTime: number; score: number },
  seo: { score: number; issues: string[]; improvements: string[] },
  aiInsights: { sentiment: string; complexity: string; accessibility: string; security: string }
): string[] {
  const recommendations: string[] = [];
  
  // Performance recommendations
  if (performance.score < 70) {
    recommendations.push('🚀 Implement code splitting and lazy loading for better performance');
  }
  if (performance.loadTime > 3000) {
    recommendations.push('⚡ Optimize images and consider using a CDN like Cloudflare or AWS CloudFront');
  }
  if (!technologies.includes('Next.js') && technologies.includes('React')) {
    recommendations.push('🔧 Consider migrating to Next.js for better SEO and performance');
  }
  
  // SEO recommendations
  if (seo.score < 80) {
    recommendations.push('🎯 Address SEO issues identified in the analysis for better search rankings');
  }
  if (seo.improvements.length > 0) {
    recommendations.push('✨ ' + seo.improvements[0]); // Add first improvement
  }
  
  // Technology recommendations
  if (!technologies.includes('Google Analytics')) {
    recommendations.push('📊 Add Google Analytics or similar for better user insights');
  }
  if (!technologies.includes('Cloudflare') && performance.loadTime > 2000) {
    recommendations.push('🌐 Implement Cloudflare CDN for global content delivery');
  }
  
  // AI insights recommendations
  if (aiInsights.complexity === 'Complex') {
    recommendations.push('🧠 Consider simplifying your tech stack for easier maintenance');
  }
  if (aiInsights.accessibility === 'Needs Improvement') {
    recommendations.push('♿ Improve accessibility with proper alt texts and heading structure');
  }
  if (aiInsights.security === 'Insecure') {
    recommendations.push('🔒 Migrate to HTTPS for better security and SEO');
  }
  
  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push('🎉 Your website is well optimized! Consider A/B testing for further improvements');
  }
  
  return recommendations.slice(0, 6); // Limit to 6 recommendations
}
