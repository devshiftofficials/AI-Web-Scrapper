# 🚀 Advanced Web Scraper Dashboard

A comprehensive, AI-powered web scraping platform with advanced features for professional data extraction and analysis.

## ✨ Features Implemented

### 🔒 Security & Compliance
- **Robots.txt Respect**: Automatically checks and respects robots.txt files with user override option
- **Input Validation**: Comprehensive XSS prevention and URL validation
- **Terms of Use**: Clear legal boundaries and user responsibility guidelines
- **Rate Limiting**: Configurable crawl delays to prevent server overload

### 🎛️ UI/Dashboard Improvements
- **Live Scrape Preview**: Real-time progress tracking with visual indicators
- **Progress Bar**: Dynamic progress bars for multi-page crawling operations
- **Error Logging**: Detailed error messages and troubleshooting information
- **Job Queue**: Background processing with status tracking
- **History Management**: Complete scraping history with comparison capabilities
- **Advanced Options Panel**: Collapsible interface for power users

### 🔄 Multi-Page & Deep Crawling
- **Depth Control**: Configurable crawling depth (0-10 levels)
- **Page Limits**: Maximum page limits to prevent runaway crawls
- **Internal Link Discovery**: Automatic detection and crawling of internal links
- **Crawl Delays**: Respectful delays between requests

### 📊 Data Extraction Options
- **Text Content**: Extract and analyze text content
- **Links**: Comprehensive link extraction with metadata
- **Images**: Image discovery with alt text and source URLs
- **Meta Tags**: SEO metadata extraction
- **Tables**: Structured table data extraction
- **Structured Data**: JSON-LD and schema.org data parsing
- **Custom Schema Extractor**: User-defined field extraction using CSS selectors

### 🤖 AI-Powered Analysis
- **Technology Detection**: Automatic detection of frameworks and technologies
- **Performance Analysis**: Load time and performance metrics
- **SEO Analysis**: Comprehensive SEO scoring and recommendations
- **AI Insights**: Sentiment analysis, complexity assessment, accessibility evaluation
- **Intelligent Recommendations**: AI-generated improvement suggestions

### 📈 Background Processing
- **Job Queue System**: Asynchronous processing for large-scale operations
- **Status Tracking**: Real-time job status updates
- **Progress Monitoring**: Live progress bars and completion tracking
- **Error Handling**: Comprehensive error reporting and recovery

### 📁 Export & Reporting
- **PDF Reports**: Professional PDF reports with charts and analysis
- **JSON Export**: Structured data export for further processing
- **CSV Export**: Tabular data export for spreadsheet applications
- **Custom Formats**: Flexible export options for different use cases

## 🛠️ Technical Architecture

### Backend APIs
- `/api/scraper/analyze` - Main scraping endpoint with advanced options
- `/api/scraper/status/[jobId]` - Job status tracking
- `/api/scraper/jobs` - Job history management

### Frontend Components
- **Dashboard**: Main interface with advanced options panel
- **Job History**: Background job management and monitoring
- **Data Extraction**: Custom schema builder and extraction options
- **Terms of Use**: Legal compliance modal

### Utilities
- **robotsTxt.ts**: Robots.txt parsing and compliance checking
- **validation.ts**: Input validation and XSS prevention
- **jobQueue.ts**: Background job management system

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Next.js 15+
- TypeScript 5+

### Installation
```bash
npm install
npm run dev
```

### Usage

1. **Basic Scraping**: Enter a URL and click "Analyze Now"
2. **Background Processing**: Use "Background" button for large operations
3. **Advanced Options**: Click "Advanced Options" to configure:
   - Crawl depth and page limits
   - Data extraction preferences
   - Custom schema fields
   - Robots.txt compliance

### Example API Usage

```javascript
// Basic scraping
const response = await fetch('/api/scraper/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://example.com',
    options: {
      depth: 2,
      maxPages: 10,
      respectRobots: true,
      extractionOptions: {
        text: true,
        links: true,
        images: true,
        customSchema: {
          product_name: '.product-title',
          price: '.price'
        }
      }
    }
  })
});

// Background processing
const jobResponse = await fetch('/api/scraper/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://example.com',
    options: { depth: 3, maxPages: 50 },
    background: true
  })
});

const { jobId } = await jobResponse.json();

// Check job status
const statusResponse = await fetch(`/api/scraper/status/${jobId}`);
const job = await statusResponse.json();
```

## 🔧 Configuration

### Environment Variables
```env
# Optional: Custom user agent
SCRAPER_USER_AGENT=Mozilla/5.0 (Custom Bot)

# Optional: Default crawl delay
SCRAPER_DEFAULT_DELAY=1000
```

### Vercel Configuration
The project includes `vercel.json` with optimized settings for serverless deployment:
- 30-second function timeout
- Optimized region selection
- Next.js framework configuration

## 📋 Legal Compliance

### Terms of Use
- Only scrape publicly available content
- Respect robots.txt and website terms of service
- Comply with GDPR, CCPA, and other privacy regulations
- Use reasonable crawl delays
- Obtain proper permissions for commercial use

### Prohibited Uses
- Scraping copyrighted content without permission
- Automated attacks or denial of service
- Accessing login-protected content
- Violating website terms of service

## 🎯 Use Cases

### E-commerce
- Product catalog extraction
- Price monitoring
- Inventory tracking
- Competitor analysis

### Content Management
- Website migration
- Content auditing
- SEO analysis
- Performance monitoring

### Research & Analytics
- Market research
- Data collection
- Trend analysis
- Academic research

## 🔮 Future Enhancements

### Planned Features
- **Monitoring Mode**: Watch pages for content changes
- **Pagination Handling**: Automatic pagination detection
- **Infinite Scroll**: Support for dynamic content loading
- **API Integration**: Connect with external data sources
- **Machine Learning**: Enhanced content classification

### Advanced Features
- **Proxy Support**: Rotating proxy networks
- **CAPTCHA Solving**: Automated CAPTCHA handling
- **JavaScript Rendering**: Full browser automation
- **Database Integration**: Direct database storage
- **Real-time Alerts**: Change notification system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests and documentation
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the Terms of Use
- Contact the development team

---

**⚠️ Important**: Always ensure your scraping activities comply with applicable laws and website terms of service. This tool is provided for educational and research purposes.