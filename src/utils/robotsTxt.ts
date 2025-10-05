// robots.txt checker utility
export interface RobotsTxtRule {
  userAgent: string;
  disallow: string[];
  allow: string[];
  crawlDelay?: number;
}

export interface RobotsTxtResult {
  canCrawl: boolean;
  crawlDelay?: number;
  rules: RobotsTxtRule[];
  error?: string;
}

export async function checkRobotsTxt(url: string): Promise<RobotsTxtResult> {
  try {
    const urlObj = new URL(url);
    const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;
    
    const response = await fetch(robotsUrl, {
      headers: {
        'User-Agent': 'WebScraperBot/1.0',
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (!response.ok) {
      // If robots.txt doesn't exist, assume crawling is allowed
      return {
        canCrawl: true,
        rules: []
      };
    }

    const robotsContent = await response.text();
    return parseRobotsTxt(robotsContent, urlObj.hostname);
  } catch (error) {
    console.error('Error checking robots.txt:', error);
    // If there's an error, assume crawling is allowed
    return {
      canCrawl: true,
      rules: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function parseRobotsTxt(content: string, _hostname: string): RobotsTxtResult {
  const lines = content.split('\n').map(line => line.trim());
  const rules: RobotsTxtRule[] = [];
  let currentRule: Partial<RobotsTxtRule> = {};
  let canCrawl = true;
  let crawlDelay: number | undefined;

  for (const line of lines) {
    if (line.startsWith('#') || line === '') continue;

    const [directive, value] = line.split(':').map(s => s.trim());
    const lowerDirective = directive.toLowerCase();

    switch (lowerDirective) {
      case 'user-agent':
        if (currentRule.userAgent) {
          rules.push(currentRule as RobotsTxtRule);
        }
        currentRule = { userAgent: value, disallow: [], allow: [] };
        break;

      case 'disallow':
        if (currentRule.userAgent) {
          currentRule.disallow!.push(value);
        }
        break;

      case 'allow':
        if (currentRule.userAgent) {
          currentRule.allow!.push(value);
        }
        break;

      case 'crawl-delay':
        if (currentRule.userAgent) {
          currentRule.crawlDelay = parseInt(value, 10);
        }
        crawlDelay = parseInt(value, 10);
        break;
    }
  }

  if (currentRule.userAgent) {
    rules.push(currentRule as RobotsTxtRule);
  }

  // Check if our bot is allowed to crawl
  const relevantRules = rules.filter(rule => 
    rule.userAgent === '*' || 
    rule.userAgent.toLowerCase().includes('webscraper') ||
    rule.userAgent.toLowerCase().includes('bot')
  );

  for (const rule of relevantRules) {
    // Check if the path is disallowed
    for (const disallowedPath of rule.disallow) {
      if (disallowedPath === '/') {
        canCrawl = false;
        break;
      }
    }
  }

  return {
    canCrawl,
    crawlDelay,
    rules
  };
}

export function isPathAllowed(path: string, rules: RobotsTxtRule[]): boolean {
  const relevantRules = rules.filter(rule => 
    rule.userAgent === '*' || 
    rule.userAgent.toLowerCase().includes('webscraper') ||
    rule.userAgent.toLowerCase().includes('bot')
  );

  for (const rule of relevantRules) {
    for (const disallowedPath of rule.disallow) {
      if (path.startsWith(disallowedPath)) {
        return false;
      }
    }
  }

  return true;
}
