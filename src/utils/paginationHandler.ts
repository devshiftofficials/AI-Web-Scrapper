// Pagination and infinite scroll detection utilities
import * as cheerio from 'cheerio';

export interface PaginationInfo {
  type: 'pagination' | 'infinite_scroll' | 'load_more' | 'none';
  nextPageUrl?: string;
  nextPageSelector?: string;
  loadMoreSelector?: string;
  pageNumbers?: number[];
  totalPages?: number;
  currentPage?: number;
}

export interface InfiniteScrollInfo {
  hasInfiniteScroll: boolean;
  scrollTriggers: Array<{
    selector: string;
    type: 'button' | 'scroll' | 'auto';
    action?: string;
  }>;
  contentContainer?: string;
  itemSelector?: string;
}

export interface PaginationResult {
  pagination: PaginationInfo;
  infiniteScroll: InfiniteScrollInfo;
  detectedPatterns: string[];
}

export function detectPagination($: cheerio.CheerioAPI, url: string): PaginationInfo {
  const paginationInfo: PaginationInfo = { type: 'none' };
  
  // Common pagination selectors
  const paginationSelectors = [
    'nav[aria-label*="pagination"]',
    '.pagination',
    '.pager',
    '.page-numbers',
    '.pagination-wrapper',
    '[class*="pagination"]',
    '[class*="pager"]',
    '[class*="page-nav"]',
    '.pagination-nav',
    '.page-navigation'
  ];

  // Look for pagination container
  let paginationContainer: any = null;
  for (const selector of paginationSelectors) {
    const container = $(selector);
    if (container.length > 0) {
      paginationContainer = container;
      break;
    }
  }

  if (!paginationContainer) {
    return paginationInfo;
  }

  // Detect pagination type and extract information
  const nextPageSelectors = [
    'a[rel="next"]',
    'a[aria-label*="next"]',
    'a[title*="next"]',
    '.next',
    '.next-page',
    '.pagination-next',
    'a:contains("Next")',
    'a:contains(">")',
    'a:contains("→")'
  ];

  const prevPageSelectors = [
    'a[rel="prev"]',
    'a[aria-label*="previous"]',
    'a[title*="previous"]',
    '.prev',
    '.previous-page',
    '.pagination-prev',
    'a:contains("Previous")',
    'a:contains("<")',
    'a:contains("←")'
  ];

  // Check for next page
  for (const selector of nextPageSelectors) {
    const nextLink = paginationContainer.find(selector).first();
    if (nextLink.length > 0) {
      const href = nextLink.attr('href');
      if (href) {
        paginationInfo.type = 'pagination';
        paginationInfo.nextPageUrl = resolveUrl(href, url);
        paginationInfo.nextPageSelector = selector;
        break;
      }
    }
  }

  // Extract page numbers
  const pageNumberSelectors = [
    'a[href*="page="]',
    'a[href*="p="]',
    'a[href*="/page/"]',
    'a[href*="/p/"]',
    '.page-number',
    '.page-link'
  ];

  const pageNumbers: number[] = [];
  for (const selector of pageNumberSelectors) {
    const links = paginationContainer.find(selector);
    links.each((_, element) => {
      const $el = $(element);
      const href = $el.attr('href');
      const text = $el.text().trim();
      
      if (href && text) {
        // Extract page number from URL or text
        const pageMatch = href.match(/[?&]page=(\d+)|[?&]p=(\d+)|\/page\/(\d+)|\/p\/(\d+)/);
        if (pageMatch) {
          const pageNum = parseInt(pageMatch[1] || pageMatch[2] || pageMatch[3] || pageMatch[4]);
          if (!isNaN(pageNum) && !pageNumbers.includes(pageNum)) {
            pageNumbers.push(pageNum);
          }
        } else if (/^\d+$/.test(text)) {
          const pageNum = parseInt(text);
          if (!isNaN(pageNum) && !pageNumbers.includes(pageNum)) {
            pageNumbers.push(pageNum);
          }
        }
      }
    });
  }

  if (pageNumbers.length > 0) {
    paginationInfo.pageNumbers = pageNumbers.sort((a, b) => a - b);
    paginationInfo.totalPages = Math.max(...pageNumbers);
    paginationInfo.currentPage = detectCurrentPage($, paginationContainer, pageNumbers);
  }

  return paginationInfo;
}

export function detectInfiniteScroll($: cheerio.CheerioAPI): InfiniteScrollInfo {
  const infiniteScrollInfo: InfiniteScrollInfo = {
    hasInfiniteScroll: false,
    scrollTriggers: []
  };

  // Common infinite scroll indicators
  const infiniteScrollIndicators = [
    '[data-infinite-scroll]',
    '[data-load-more]',
    '[data-next-page]',
    '.infinite-scroll',
    '.load-more',
    '.infinite-loader',
    '.scroll-loader',
    '[class*="infinite"]',
    '[class*="load-more"]',
    '[class*="scroll-load"]'
  ];

  // Look for infinite scroll containers
  let infiniteScrollContainer: any = null;
  for (const selector of infiniteScrollIndicators) {
    const container = $(selector);
    if (container.length > 0) {
      infiniteScrollContainer = container;
      infiniteScrollInfo.hasInfiniteScroll = true;
      break;
    }
  }

  if (!infiniteScrollInfo.hasInfiniteScroll) {
    // Check for load more buttons
    const loadMoreSelectors = [
      'button:contains("Load More")',
      'button:contains("Show More")',
      'button:contains("View More")',
      'a:contains("Load More")',
      'a:contains("Show More")',
      'a:contains("View More")',
      '.load-more-btn',
      '.show-more-btn',
      '.view-more-btn',
      '[class*="load-more"]',
      '[class*="show-more"]'
    ];

    for (const selector of loadMoreSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        infiniteScrollInfo.hasInfiniteScroll = true;
        infiniteScrollInfo.scrollTriggers.push({
          selector,
          type: 'button',
          action: 'click'
        });
        break;
      }
    }
  }

  // Detect content containers
  const contentContainerSelectors = [
    '.content',
    '.posts',
    '.items',
    '.list',
    '.grid',
    '.feed',
    '.timeline',
    '[class*="content"]',
    '[class*="posts"]',
    '[class*="items"]',
    '[class*="list"]',
    '[class*="grid"]',
    '[class*="feed"]'
  ];

  for (const selector of contentContainerSelectors) {
    const container = $(selector);
    if (container.length > 0 && container.children().length > 5) {
      infiniteScrollInfo.contentContainer = selector;
      break;
    }
  }

  // Detect item selectors
  const itemSelectors = [
    '.item',
    '.post',
    '.article',
    '.entry',
    '.card',
    '.tile',
    '[class*="item"]',
    '[class*="post"]',
    '[class*="article"]',
    '[class*="entry"]',
    '[class*="card"]'
  ];

  for (const selector of itemSelectors) {
    const items = $(selector);
    if (items.length > 3) {
      infiniteScrollInfo.itemSelector = selector;
      break;
    }
  }

  return infiniteScrollInfo;
}

export function detectLoadMoreButtons($: cheerio.CheerioAPI): Array<{
  selector: string;
  text: string;
  href?: string;
  type: 'button' | 'link';
}> {
  const loadMoreButtons: Array<{
    selector: string;
    text: string;
    href?: string;
    type: 'button' | 'link';
  }> = [];

  const loadMoreTexts = [
    'Load More',
    'Show More',
    'View More',
    'See More',
    'Load Additional',
    'Show Additional',
    'View Additional',
    'More Results',
    'More Items',
    'More Posts',
    'More Articles',
    'Load Next',
    'Show Next',
    'View Next'
  ];

  for (const text of loadMoreTexts) {
    // Check buttons
    const buttons = $(`button:contains("${text}"), input[type="button"]:contains("${text}")`);
    buttons.each((_, element) => {
      const $el = $(element);
      loadMoreButtons.push({
        selector: $el.prop('tagName').toLowerCase() + (element.className ? '.' + element.className.split(' ').join('.') : ''),
        text: $el.text().trim(),
        type: 'button'
      });
    });

    // Check links
    const links = $(`a:contains("${text}")`);
    links.each((_, element) => {
      const $el = $(element);
      loadMoreButtons.push({
        selector: 'a' + (element.className ? '.' + element.className.split(' ').join('.') : ''),
        text: $el.text().trim(),
        href: $el.attr('href'),
        type: 'link'
      });
    });
  }

  return loadMoreButtons;
}

export function analyzePaginationPatterns($: cheerio.CheerioAPI, url: string): PaginationResult {
  const pagination = detectPagination($, url);
  const infiniteScroll = detectInfiniteScroll($);
  const loadMoreButtons = detectLoadMoreButtons($);
  
  const detectedPatterns: string[] = [];

  if (pagination.type !== 'none') {
    detectedPatterns.push('Traditional pagination');
  }

  if (infiniteScroll.hasInfiniteScroll) {
    detectedPatterns.push('Infinite scroll');
  }

  if (loadMoreButtons.length > 0) {
    detectedPatterns.push('Load more buttons');
    infiniteScroll.scrollTriggers.push(...loadMoreButtons.map(btn => ({
      selector: btn.selector,
      type: 'button' as const,
      action: btn.type === 'button' ? 'click' : 'navigate'
    })));
  }

  // Check for AJAX-based pagination
  const ajaxIndicators = [
    '[data-ajax]',
    '[data-url]',
    '[data-endpoint]',
    '[data-api]',
    '.ajax-pagination',
    '.ajax-load'
  ];

  for (const selector of ajaxIndicators) {
    if ($(selector).length > 0) {
      detectedPatterns.push('AJAX pagination');
      break;
    }
  }

  return {
    pagination,
    infiniteScroll,
    detectedPatterns
  };
}

function detectCurrentPage($: cheerio.CheerioAPI, container: cheerio.Cheerio<cheerio.Element>, pageNumbers: number[]): number {
  // Look for current page indicators
  const currentPageSelectors = [
    '.current',
    '.active',
    '.selected',
    '.current-page',
    '.active-page',
    '[aria-current="page"]',
    '[class*="current"]',
    '[class*="active"]'
  ];

  for (const selector of currentPageSelectors) {
    const currentElement = container.find(selector);
    if (currentElement.length > 0) {
      const text = currentElement.text().trim();
      const pageNum = parseInt(text);
      if (!isNaN(pageNum) && pageNumbers.includes(pageNum)) {
        return pageNum;
      }
    }
  }

  return 1; // Default to page 1
}

function resolveUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return href;
  }
}

export async function crawlPagination(
  startUrl: string,
  maxPages: number = 10,
  delay: number = 1000
): Promise<Array<{ url: string; page: number; content: string }>> {
  const results: Array<{ url: string; page: number; content: string }> = [];
  let currentUrl = startUrl;
  let currentPage = 1;

  while (currentPage <= maxPages && currentUrl) {
    try {
      console.log(`Crawling page ${currentPage}: ${currentUrl}`);
      
      const response = await fetch(currentUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        console.warn(`Failed to fetch page ${currentPage}: ${response.status}`);
        break;
      }

      const content = await response.text();
      results.push({
        url: currentUrl,
        page: currentPage,
        content
      });

      // Analyze pagination for next page
      const $ = cheerio.load(content);
      const paginationInfo = detectPagination($, currentUrl);
      
      if (paginationInfo.nextPageUrl && paginationInfo.nextPageUrl !== currentUrl) {
        currentUrl = paginationInfo.nextPageUrl;
        currentPage++;
        
        // Add delay between requests
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } else {
        break; // No more pages
      }
    } catch (error) {
      console.error(`Error crawling page ${currentPage}:`, error);
      break;
    }
  }

  return results;
}
