import * as cheerio from 'cheerio';
import { ScrapingOptions, ScrapingResult } from '../utils/jobQueue';
import { analyzePaginationPatterns, crawlPagination } from '../utils/paginationHandler';

// Main scraping function that can be used by both direct calls and job queue
export async function performScraping(url: string, options: ScrapingOptions): Promise<ScrapingResult> {
  const startTime = Date.now();
  
  // Handle pagination and infinite scroll if maxPages > 1
  if (options.maxPages > 1) {
    return await performMultiPageScraping(url, options, startTime);
  }

  // Single page scraping (existing logic)
  return await performSinglePageScraping(url, options, startTime);
}

async function performSinglePageScraping(url: string, options: ScrapingOptions, startTime: number): Promise<ScrapingResult> {
  // Fetch the page content using server-side fetch
  const response = await fetch(url, {
    headers: {
      'User-Agent': options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    },
    // Add timeout for Vercel compatibility
    signal: AbortSignal.timeout(25000) // 25 seconds timeout
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const content = await response.text();
  const loadTime = Date.now() - startTime;

  // Parse content with cheerio
  const $ = cheerio.load(content);

  // Extract basic information
  const title = $('title').text() || 'No title found';
  const description = $('meta[name="description"]').attr('content') || 'No description found';

  // Detect technologies and languages
  const technologies = detectTechnologies($, content);
  const languages = detectProgrammingLanguages($, content);

  // Enhanced performance analysis with AI
  const performance = analyzePerformanceWithAI(loadTime, content);

  // Enhanced SEO analysis
  const seo = analyzeSEOWithAI($, content);

  // AI-powered insights
  const aiInsights = generateAIInsights(content, technologies, performance);

  // Generate intelligent recommendations
  const recommendations = generateIntelligentRecommendations(technologies, performance, seo, aiInsights);

  // Extract additional data based on options
  const extractedData = await extractData($, content, options.extractionOptions);

  // Analyze pagination patterns
  const paginationAnalysis = analyzePaginationPatterns($, url);

  const result: ScrapingResult = {
    url,
    title,
    description,
    technologies,
    languages,
    performance,
    seo,
    recommendations,
    aiInsights,
    extractedData: {
      ...extractedData,
      paginationInfo: paginationAnalysis
    },
    analyzedAt: new Date().toISOString()
  };

  return result;
}

async function performMultiPageScraping(url: string, options: ScrapingOptions, startTime: number): Promise<ScrapingResult> {
  console.log(`Starting multi-page scraping for ${url} (max pages: ${options.maxPages})`);
  
  // First, analyze the initial page for pagination patterns
  const initialResponse = await fetch(url, {
    headers: {
      'User-Agent': options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    signal: AbortSignal.timeout(25000)
  });

  if (!initialResponse.ok) {
    throw new Error(`HTTP ${initialResponse.status}: ${initialResponse.statusText}`);
  }

  const initialContent = await initialResponse.text();
  const $ = cheerio.load(initialContent);
  
  // Analyze pagination patterns
  const paginationAnalysis = analyzePaginationPatterns($, url);
  
  // If pagination is detected, crawl multiple pages
  if (paginationAnalysis.pagination.type !== 'none' || paginationAnalysis.infiniteScroll.hasInfiniteScroll) {
    console.log(`Detected pagination patterns: ${paginationAnalysis.detectedPatterns.join(', ')}`);
    
    // Crawl paginated content
    const paginatedResults = await crawlPagination(
      url, 
      options.maxPages, 
      options.crawlDelay || 1000
    );
    
    // Combine content from all pages
    const combinedContent = paginatedResults.map(r => r.content).join('\n');
    const combined$ = cheerio.load(combinedContent);
    
    // Extract data from combined content
    const extractedData = await extractData(combined$, combinedContent, options.extractionOptions);
    
    // Generate comprehensive analysis
    const title = $('title').text() || 'No title found';
    const description = $('meta[name="description"]').attr('content') || 'No description found';
    const technologies = detectTechnologies($, initialContent);
    const languages = detectProgrammingLanguages($, initialContent);
    const performance = analyzePerformanceWithAI(Date.now() - startTime, combinedContent);
    const seo = analyzeSEOWithAI($, initialContent);
    const aiInsights = generateAIInsights(combinedContent, technologies, performance);
    const recommendations = generateIntelligentRecommendations(technologies, performance, seo, aiInsights);
    
    // Add pagination-specific data
    const paginationData = {
      totalPagesCrawled: paginatedResults.length,
      pages: paginatedResults.map(r => ({
        url: r.url,
        page: r.page,
        contentLength: r.content.length
      })),
      paginationPatterns: paginationAnalysis.detectedPatterns,
      paginationType: paginationAnalysis.pagination.type,
      infiniteScrollDetected: paginationAnalysis.infiniteScroll.hasInfiniteScroll
    };
    
    return {
      url,
      title,
      description,
      technologies,
      languages,
      performance,
      seo,
      recommendations,
      aiInsights,
      extractedData: {
        ...extractedData,
        paginationInfo: paginationAnalysis,
        paginationData
      },
      analyzedAt: new Date().toISOString()
    };
  } else {
    // No pagination detected, fall back to single page scraping
    console.log('No pagination patterns detected, performing single page scraping');
    return await performSinglePageScraping(url, options, startTime);
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

// AI-enhanced performance analysis (Vercel-compatible)
function analyzePerformanceWithAI(loadTime: number, content: string): {
  loadTime: number;
  score: number;
  metrics: {
    firstPaint: number;
    firstContentfulPaint: number;
    domContentLoaded: number;
    loadComplete: number;
  };
} {
  try {
    // Estimate performance metrics based on content analysis
    const contentSize = content.length;
    const imageCount = (content.match(/<img[^>]*>/gi) || []).length;
    const scriptCount = (content.match(/<script[^>]*>/gi) || []).length;
    const cssCount = (content.match(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi) || []).length;
    
    // Estimate metrics based on content complexity
    const estimatedFirstPaint = Math.min(loadTime * 0.3, 2000);
    const estimatedFirstContentfulPaint = Math.min(loadTime * 0.5, 3000);
    const estimatedDomContentLoaded = Math.min(loadTime * 0.7, 4000);
    const estimatedLoadComplete = loadTime;
    
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
    
    // Content size analysis
    if (contentSize > 1000000) { // > 1MB
      score -= 15;
      deductions.push('Large page size (>1MB)');
    } else if (contentSize > 500000) { // > 500KB
      score -= 8;
      deductions.push('Moderate page size (>500KB)');
    }
    
    // Resource count analysis
    if (imageCount > 20) {
      score -= 10;
      deductions.push('High number of images (>20)');
    }
    if (scriptCount > 10) {
      score -= 8;
      deductions.push('High number of scripts (>10)');
    }
    if (cssCount > 5) {
      score -= 5;
      deductions.push('Multiple CSS files (>5)');
    }
    
    // Estimated First Contentful Paint analysis
    if (estimatedFirstContentfulPaint > 2500) {
      score -= 25;
      deductions.push('Poor estimated First Contentful Paint (>2.5s)');
    } else if (estimatedFirstContentfulPaint > 1800) {
      score -= 15;
      deductions.push('Slow estimated First Contentful Paint (>1.8s)');
    }
    
    // Estimated DOM Content Loaded analysis
    if (estimatedDomContentLoaded > 2000) {
      score -= 20;
      deductions.push('Slow estimated DOM Content Loaded (>2s)');
    }
    
    return {
      loadTime,
      score: Math.max(0, score),
      metrics: {
        firstPaint: estimatedFirstPaint,
        firstContentfulPaint: estimatedFirstContentfulPaint,
        domContentLoaded: estimatedDomContentLoaded,
        loadComplete: estimatedLoadComplete
      }
    };
  } catch (error) {
    console.error('Performance analysis error:', error);
    return {
      loadTime,
      score: Math.max(0, 100 - Math.floor(loadTime / 100)),
      metrics: {
        firstPaint: loadTime * 0.3,
        firstContentfulPaint: loadTime * 0.5,
        domContentLoaded: loadTime * 0.7,
        loadComplete: loadTime
      }
    };
  }
}

// AI-enhanced SEO analysis
function analyzeSEOWithAI($: cheerio.Root, _content: string): {
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
  _content: string,
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
  
  const text = _content.toLowerCase();
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
  const hasAltTexts = _content.includes('alt=');
  const hasHeadings = _content.includes('<h1') || _content.includes('<h2');
  
  if (!hasAltTexts || !hasHeadings) accessibility = 'Needs Improvement';
  
  // Security analysis
  let security = 'Secure';
  if (_content.includes('http://') && !_content.includes('https://')) security = 'Insecure';
  if (_content.includes('password') || _content.includes('login')) security = 'Needs Review';
  
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

// Data extraction function based on user options
async function extractData($: cheerio.Root, content: string, options: ScrapingOptions['extractionOptions']): Promise<ScrapingResult['extractedData']> {
  const extractedData: ScrapingResult['extractedData'] = {};

  try {
    // Extract text content
    if (options.text) {
      extractedData.text = $('body').text().trim();
    }

    // Extract links
    if (options.links) {
      const links: Array<{ url: string; text: string; }> = [];
      $('a[href]').each((_, element) => {
        const href = $(element).attr('href');
        const text = $(element).text().trim();
        if (href && text) {
          links.push({ url: href, text });
        }
      });
      extractedData.links = links;
    }

    // Extract images
    if (options.images) {
      const images: Array<{ src: string; alt: string; }> = [];
      $('img').each((_, element) => {
        const src = $(element).attr('src');
        const alt = $(element).attr('alt') || '';
        if (src) {
          images.push({ src, alt });
        }
      });
      extractedData.images = images;
    }

    // Extract meta tags
    if (options.metaTags) {
      const metaTags: Record<string, string> = {};
      $('meta').each((_, element) => {
        const name = $(element).attr('name') || $(element).attr('property');
        const content = $(element).attr('content');
        if (name && content) {
          metaTags[name] = content;
        }
      });
      extractedData.metaTags = metaTags;
    }

    // Extract tables
    if (options.tables) {
      const tables: Array<{ headers: string[]; rows: string[][]; }> = [];
      $('table').each((_, tableElement) => {
        const headers: string[] = [];
        const rows: string[][] = [];

        // Extract headers
        $(tableElement).find('th').each((_, th) => {
          headers.push($(th).text().trim());
        });

        // Extract rows
        $(tableElement).find('tr').each((_, tr) => {
          const row: string[] = [];
          $(tr).find('td').each((_, td) => {
            row.push($(td).text().trim());
          });
          if (row.length > 0) {
            rows.push(row);
          }
        });

        if (headers.length > 0 || rows.length > 0) {
          tables.push({ headers, rows });
        }
      });
      extractedData.tables = tables;
    }

    // Extract structured data (JSON-LD)
    if (options.structuredData) {
      const structuredData: Record<string, unknown>[] = [];
      $('script[type="application/ld+json"]').each((_, element) => {
        try {
          const jsonContent = $(element).html();
          if (jsonContent) {
            const parsed = JSON.parse(jsonContent) as Record<string, unknown>;
            structuredData.push(parsed);
          }
        } catch (error) {
          console.warn('Failed to parse JSON-LD:', error);
        }
      });
      extractedData.structuredData = structuredData;
    }

    // Extract custom schema data
    if (options.customSchema) {
      const customData: Record<string, string | string[]> = {};
      for (const [fieldName, selector] of Object.entries(options.customSchema)) {
        try {
          const elements = $(selector as string);
          if (elements.length === 1) {
            customData[fieldName] = elements.text().trim();
          } else if (elements.length > 1) {
            customData[fieldName] = elements.map((_, el) => $(el).text().trim()).get();
          }
        } catch (error) {
          console.warn(`Failed to extract field "${fieldName}" with selector "${selector}":`, error);
          customData[fieldName] = '';
        }
      }
      extractedData.customData = customData;
    }

  } catch (error) {
    console.error('Error extracting data:', error);
  }

  return extractedData;
}
