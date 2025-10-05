'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Globe, 
  Zap, 
  Shield, 
  BarChart3, 
  Download,
  Code,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Brain,
  Layers,
  Activity,
  Settings,
  Play,
  Pause,
  History,
  Monitor,
  Database,
  FileText,
  Link,
  Image,
  Table,
  Schema,
  Robot,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
  Plus,
  Minus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { generatePDFReport, generateJSONReport } from '@/utils/pdfGenerator';

interface ScrapingResult {
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

interface ScrapingJob {
  id: string;
  url: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: ScrapingResult;
  error?: string;
}

interface ScrapingOptions {
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

export default function Dashboard() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScrapingResult | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // New state for enhanced features
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [scrapingOptions, setScrapingOptions] = useState<ScrapingOptions>({
    depth: 0,
    maxPages: 1,
    respectRobots: true,
    extractionOptions: {
      text: false,
      links: false,
      images: false,
      metaTags: false,
      tables: false,
      structuredData: false,
    },
    crawlDelay: 1000,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  
  const [jobs, setJobs] = useState<ScrapingJob[]>([]);
  const [activeJob, setActiveJob] = useState<ScrapingJob | null>(null);
  const [showJobHistory, setShowJobHistory] = useState(false);
  const [customSchemaFields, setCustomSchemaFields] = useState<Array<{name: string, selector: string}>>([]);
  const [showTermsOfUse, setShowTermsOfUse] = useState(false);

  // Load job history on component mount
  useEffect(() => {
    loadJobHistory();
  }, []);

  const loadJobHistory = async () => {
    try {
      const response = await fetch('/api/scraper/jobs');
      const data = await response.json();
      if (response.ok) {
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Failed to load job history:', error);
    }
  };

  const handleScrape = async (background = false) => {
    if (!url) {
      toast.error('Please enter a URL');
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    try {
      // Prepare custom schema if fields are defined
      const options = { ...scrapingOptions };
      if (customSchemaFields.length > 0) {
        const customSchema: Record<string, string> = {};
        customSchemaFields.forEach(field => {
          if (field.name && field.selector) {
            customSchema[field.name] = field.selector;
          }
        });
        options.extractionOptions.customSchema = customSchema;
      }

      const response = await fetch('/api/scraper/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url, 
          options,
          background,
          userId: 'user_' + Date.now() // Simple user ID for demo
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze website');
      }

      if (background) {
        // Background job started
        toast.success('Scraping job started in background!');
        setActiveJob({ 
          id: data.jobId, 
          url, 
          status: 'pending', 
          progress: 0, 
          createdAt: new Date().toISOString() 
        });
        loadJobHistory(); // Refresh job list
      } else {
        // Immediate result
        setResult(data);
        toast.success('Website analyzed successfully with AI!');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze website. Please try again.';
      toast.error(errorMessage);
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkJobStatus = async (jobId: string) => {
    try {
      const response = await fetch(`/api/scraper/status/${jobId}`);
      const job = await response.json();
      
      if (response.ok) {
        setActiveJob(job);
        if (job.status === 'completed' && job.result) {
          setResult(job.result);
          toast.success('Background scraping completed!');
        } else if (job.status === 'failed') {
          toast.error(`Scraping failed: ${job.error}`);
        }
      }
    } catch (error) {
      console.error('Failed to check job status:', error);
    }
  };

  // Poll job status if there's an active job
  useEffect(() => {
    if (activeJob && (activeJob.status === 'pending' || activeJob.status === 'running')) {
      const interval = setInterval(() => {
        checkJobStatus(activeJob.id);
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [activeJob]);

  const downloadPDF = () => {
    if (!result) return;
    
    toast.success('Generating PDF report...');
    try {
      generatePDFReport(result);
      toast.success('PDF report downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF. Downloading JSON instead.');
      generateJSONReport(result);
    }
  };

  const downloadJSON = () => {
    if (!result) return;
    
    toast.success('Generating JSON report...');
    generateJSONReport(result);
    toast.success('JSON report downloaded successfully!');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400 bg-green-400/20';
    if (score >= 60) return 'text-yellow-400 bg-yellow-400/20';
    return 'text-red-400 bg-red-400/20';
  };

  const addCustomSchemaField = () => {
    setCustomSchemaFields([...customSchemaFields, { name: '', selector: '' }]);
  };

  const removeCustomSchemaField = (index: number) => {
    setCustomSchemaFields(customSchemaFields.filter((_, i) => i !== index));
  };

  const updateCustomSchemaField = (index: number, field: 'name' | 'selector', value: string) => {
    const updated = [...customSchemaFields];
    updated[index][field] = value;
    setCustomSchemaFields(updated);
  };

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-400/20';
      case 'running': return 'text-blue-400 bg-blue-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      case 'failed': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getJobStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'running': return Loader2;
      case 'pending': return Clock;
      case 'failed': return X;
      default: return Clock;
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Globe },
    { id: 'performance', name: 'Performance', icon: Zap },
    { id: 'technologies', name: 'Technologies', icon: Code },
    { id: 'seo', name: 'SEO Analysis', icon: Target },
    { id: 'ai', name: 'AI Insights', icon: Brain },
    { id: 'extracted', name: 'Extracted Data', icon: Database },
    { id: 'jobs', name: 'Job History', icon: History },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-16">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 py-12"
      >
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl font-bold text-white mb-6"
          >
            AI-Powered Website Analysis{' '}
            <motion.span
              animate={{ 
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent bg-[length:200%_auto]"
            >
              Dashboard
            </motion.span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto"
          >
            Get comprehensive insights powered by AI and Machine Learning. 
            Analyze technologies, performance, SEO, and get intelligent recommendations.
          </motion.p>
        </div>

        {/* Enhanced Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="max-w-6xl mx-auto mb-12"
        >
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter website URL (e.g., https://example.com)"
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleScrape(false)}
                  disabled={isLoading}
                  className="px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="rounded-full h-4 w-4 border-2 border-white border-t-transparent"
                      />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4" />
                      <span>Analyze Now</span>
                    </>
                  )}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleScrape(true)}
                  disabled={isLoading}
                  className="px-6 py-4 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
                >
                  <Play className="h-4 w-4" />
                  <span>Background</span>
                </motion.button>
              </div>
            </div>

            {/* Advanced Options Toggle */}
            <div className="mt-4 flex items-center justify-between">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-200"
              >
                <Settings className="h-4 w-4" />
                <span>Advanced Options</span>
                {showAdvancedOptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowTermsOfUse(true)}
                className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
              >
                Terms of Use
              </motion.button>
            </div>

            {/* Advanced Options Panel */}
            <AnimatePresence>
              {showAdvancedOptions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 space-y-6"
                >
                  {/* Crawling Options */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Crawl Depth</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={scrapingOptions.depth}
                        onChange={(e) => setScrapingOptions({...scrapingOptions, depth: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Max Pages</label>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={scrapingOptions.maxPages}
                        onChange={(e) => setScrapingOptions({...scrapingOptions, maxPages: parseInt(e.target.value) || 1})}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Crawl Delay (ms)</label>
                      <input
                        type="number"
                        min="0"
                        max="10000"
                        value={scrapingOptions.crawlDelay}
                        onChange={(e) => setScrapingOptions({...scrapingOptions, crawlDelay: parseInt(e.target.value) || 1000})}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>

                  {/* Respect Robots.txt */}
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setScrapingOptions({...scrapingOptions, respectRobots: !scrapingOptions.respectRobots})}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
                        scrapingOptions.respectRobots 
                          ? 'bg-green-500/20 text-green-300' 
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {scrapingOptions.respectRobots ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      <span>Respect robots.txt</span>
                    </button>
                  </div>

                  {/* Data Extraction Options */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4">Data Extraction Options</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { key: 'text', label: 'Text Content', icon: FileText },
                        { key: 'links', label: 'Links', icon: Link },
                        { key: 'images', label: 'Images', icon: Image },
                        { key: 'metaTags', label: 'Meta Tags', icon: Schema },
                        { key: 'tables', label: 'Tables', icon: Table },
                        { key: 'structuredData', label: 'Structured Data', icon: Database },
                      ].map((option) => {
                        const Icon = option.icon;
                        return (
                          <motion.button
                            key={option.key}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setScrapingOptions({
                              ...scrapingOptions,
                              extractionOptions: {
                                ...scrapingOptions.extractionOptions,
                                [option.key]: !scrapingOptions.extractionOptions[option.key as keyof typeof scrapingOptions.extractionOptions]
                              }
                            })}
                            className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors duration-200 ${
                              scrapingOptions.extractionOptions[option.key as keyof typeof scrapingOptions.extractionOptions]
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-white/5 text-gray-300 border border-white/10'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="text-sm">{option.label}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Schema Fields */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-white">Custom Schema Extractor</h4>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={addCustomSchemaField}
                        className="flex items-center space-x-2 px-3 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors duration-200"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Field</span>
                      </motion.button>
                    </div>
                    
                    <div className="space-y-3">
                      {customSchemaFields.map((field, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <input
                            type="text"
                            placeholder="Field name (e.g., product_name)"
                            value={field.name}
                            onChange={(e) => updateCustomSchemaField(index, 'name', e.target.value)}
                            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                          <input
                            type="text"
                            placeholder="CSS selector (e.g., .product-title)"
                            value={field.selector}
                            onChange={(e) => updateCustomSchemaField(index, 'selector', e.target.value)}
                            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => removeCustomSchemaField(index)}
                            className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors duration-200"
                          >
                            <Minus className="h-4 w-4" />
                          </motion.button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active Job Progress */}
            <AnimatePresence>
              {activeJob && (activeJob.status === 'pending' || activeJob.status === 'running') && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                      <span className="text-blue-300 font-medium">
                        {activeJob.status === 'pending' ? 'Queued' : 'Processing'} Job
                      </span>
                    </div>
                    <span className="text-blue-300 text-sm">{activeJob.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${activeJob.progress}%` }}
                      transition={{ duration: 0.5 }}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                    />
                  </div>
                  <p className="text-gray-400 text-sm mt-2 truncate">{activeJob.url}</p>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6"
            >
              {[
                { icon: Globe, label: 'Websites', value: '10K+', color: 'text-blue-400' },
                { icon: Zap, label: 'Avg Speed', value: '<2s', color: 'text-yellow-400' },
                { icon: Shield, label: 'Accuracy', value: '99.9%', color: 'text-green-400' },
                { icon: Brain, label: 'AI Models', value: '5+', color: 'text-purple-400' },
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="text-center p-3 bg-white/5 rounded-lg"
                  >
                    <Icon className={`h-6 w-6 ${stat.color} mx-auto mb-2`} />
                    <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs text-gray-400">{stat.label}</div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </motion.div>

        {/* Results Section */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto"
            >
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
                {/* Tab Navigation */}
                <div className="border-b border-white/10">
                  <div className="flex overflow-x-auto">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <motion.button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          whileHover={{ y: -2 }}
                          className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors duration-200 ${
                            activeTab === tab.id
                              ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/10'
                              : 'text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{tab.name}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="p-8">
                  <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                      <motion.div
                        key="overview"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                      >
                        {/* Website Info */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/5 rounded-xl p-6"
                          >
                            <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                              <Globe className="h-5 w-5 text-blue-400" />
                              <span>Website Information</span>
                            </h3>
                            <div className="space-y-3">
                              <div>
                                <label className="text-sm text-gray-400">URL</label>
                                <p className="text-white font-mono text-sm break-all">{result.url}</p>
                              </div>
                              <div>
                                <label className="text-sm text-gray-400">Title</label>
                                <p className="text-white">{result.title}</p>
                              </div>
                              <div>
                                <label className="text-sm text-gray-400">Description</label>
                                <p className="text-gray-300">{result.description}</p>
                              </div>
                            </div>
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white/5 rounded-xl p-6"
                          >
                            <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                              <BarChart3 className="h-5 w-5 text-green-400" />
                              <span>Overall Scores</span>
                            </h3>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-300">Performance</span>
                                <div className="flex items-center space-x-2">
                                  <div className="w-24 bg-gray-700 rounded-full h-2">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${result.performance.score}%` }}
                                      transition={{ duration: 1, delay: 0.5 }}
                                      className={`h-2 rounded-full ${getScoreColor(result.performance.score).split(' ')[0].replace('text-', 'bg-')}`}
                                    />
                                  </div>
                                  <span className={`font-semibold ${getScoreColor(result.performance.score).split(' ')[0]}`}>
                                    {result.performance.score}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-300">SEO</span>
                                <div className="flex items-center space-x-2">
                                  <div className="w-24 bg-gray-700 rounded-full h-2">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${result.seo.score}%` }}
                                      transition={{ duration: 1, delay: 0.7 }}
                                      className={`h-2 rounded-full ${getScoreColor(result.seo.score).split(' ')[0].replace('text-', 'bg-')}`}
                                    />
                                  </div>
                                  <span className={`font-semibold ${getScoreColor(result.seo.score).split(' ')[0]}`}>
                                    {result.seo.score}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </div>

                        {/* Quick Actions */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="flex flex-wrap gap-4"
                        >
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={downloadPDF}
                            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 transition-all duration-200"
                          >
                            <Download className="h-4 w-4" />
                            <span>Download PDF Report</span>
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={downloadJSON}
                            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                          >
                            <Download className="h-4 w-4" />
                            <span>Download JSON</span>
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setActiveTab('technologies')}
                            className="flex items-center space-x-2 px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-all duration-200"
                          >
                            <Code className="h-4 w-4" />
                            <span>View Technologies</span>
                          </motion.button>
                        </motion.div>
                      </motion.div>
                    )}

                    {activeTab === 'performance' && (
                      <motion.div
                        key="performance"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <h3 className="text-2xl font-semibold text-white mb-6 flex items-center space-x-2">
                          <Zap className="h-6 w-6 text-yellow-400" />
                          <span>Performance Analysis</span>
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {[
                            { label: 'Load Time', value: `${result.performance.loadTime}ms`, icon: Clock, color: 'text-blue-400' },
                            { label: 'First Paint', value: `${result.performance.metrics.firstPaint}ms`, icon: Activity, color: 'text-green-400' },
                            { label: 'DOM Ready', value: `${result.performance.metrics.domContentLoaded}ms`, icon: CheckCircle, color: 'text-yellow-400' },
                            { label: 'Load Complete', value: `${result.performance.metrics.loadComplete}ms`, icon: Target, color: 'text-purple-400' },
                          ].map((metric, index) => {
                            const Icon = metric.icon;
                            return (
                              <motion.div
                                key={metric.label}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white/5 rounded-xl p-6 text-center"
                              >
                                <Icon className={`h-8 w-8 ${metric.color} mx-auto mb-3`} />
                                <div className={`text-2xl font-bold ${metric.color} mb-2`}>
                                  {metric.value}
                                </div>
                                <div className="text-gray-400 text-sm">{metric.label}</div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'technologies' && (
                      <motion.div
                        key="technologies"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <h3 className="text-2xl font-semibold text-white mb-6 flex items-center space-x-2">
                          <Code className="h-6 w-6 text-blue-400" />
                          <span>Technologies & Languages Detected</span>
                        </h3>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="bg-white/5 rounded-xl p-6">
                            <h4 className="text-lg font-semibold text-white mb-4">Technologies</h4>
                            <div className="flex flex-wrap gap-2">
                              {result.technologies.map((tech, index) => (
                                <motion.span
                                  key={index}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium"
                                >
                                  {tech}
                                </motion.span>
                              ))}
                            </div>
                          </div>
                          
                          <div className="bg-white/5 rounded-xl p-6">
                            <h4 className="text-lg font-semibold text-white mb-4">Programming Languages</h4>
                            <div className="flex flex-wrap gap-2">
                              {result.languages?.map((lang, index) => (
                                <motion.span
                                  key={index}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm font-medium"
                                >
                                  {lang}
                                </motion.span>
                              )) || (
                                <span className="text-gray-400 text-sm">No languages detected</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'seo' && (
                      <motion.div
                        key="seo"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <h3 className="text-2xl font-semibold text-white mb-6 flex items-center space-x-2">
                          <Target className="h-6 w-6 text-green-400" />
                          <span>SEO Analysis</span>
                        </h3>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="bg-white/5 rounded-xl p-6">
                            <h4 className="text-lg font-semibold text-white mb-4">SEO Score: {result.seo.score}/100</h4>
                            <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${result.seo.score}%` }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className={`h-3 rounded-full ${getScoreColor(result.seo.score).split(' ')[0].replace('text-', 'bg-')}`}
                              />
                            </div>
                            
                            {result.seo.issues.length > 0 && (
                              <div>
                                <h5 className="text-white font-medium mb-3 flex items-center space-x-2">
                                  <AlertTriangle className="h-4 w-4 text-red-400" />
                                  <span>Issues Found</span>
                                </h5>
                                <ul className="space-y-2">
                                  {result.seo.issues.map((issue, index) => (
                                    <motion.li
                                      key={index}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: index * 0.1 }}
                                      className="text-red-300 text-sm flex items-start space-x-2"
                                    >
                                      <span className="text-red-400 mt-1">•</span>
                                      <span>{issue}</span>
                                    </motion.li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          
                          <div className="bg-white/5 rounded-xl p-6">
                            <h4 className="text-lg font-semibold text-white mb-4">Recommendations</h4>
                            <ul className="space-y-2">
                              {result.recommendations.map((rec, index) => (
                                <motion.li
                                  key={index}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="text-gray-300 text-sm flex items-start space-x-2"
                                >
                                  <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                                  <span>{rec}</span>
                                </motion.li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'ai' && (
                      <motion.div
                        key="ai"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <h3 className="text-2xl font-semibold text-white mb-6 flex items-center space-x-2">
                          <Brain className="h-6 w-6 text-purple-400" />
                          <span>AI-Powered Insights</span>
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {[
                            { 
                              label: 'Sentiment Analysis', 
                              value: result.aiInsights?.sentiment || 'Positive', 
                              icon: TrendingUp, 
                              color: 'text-green-400',
                              bg: 'bg-green-400/20'
                            },
                            { 
                              label: 'Complexity Score', 
                              value: result.aiInsights?.complexity || 'Medium', 
                              icon: Layers, 
                              color: 'text-blue-400',
                              bg: 'bg-blue-400/20'
                            },
                            { 
                              label: 'Accessibility', 
                              value: result.aiInsights?.accessibility || 'Good', 
                              icon: Shield, 
                              color: 'text-yellow-400',
                              bg: 'bg-yellow-400/20'
                            },
                            { 
                              label: 'Security Rating', 
                              value: result.aiInsights?.security || 'Secure', 
                              icon: Shield, 
                              color: 'text-red-400',
                              bg: 'bg-red-400/20'
                            },
                          ].map((insight, index) => {
                            const Icon = insight.icon;
                            return (
                              <motion.div
                                key={insight.label}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className={`${insight.bg} rounded-xl p-6 text-center`}
                              >
                                <Icon className={`h-8 w-8 ${insight.color} mx-auto mb-3`} />
                                <div className={`text-xl font-bold ${insight.color} mb-2`}>
                                  {insight.value}
                                </div>
                                <div className="text-gray-300 text-sm">{insight.label}</div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {activeTab === 'extracted' && (
                      <motion.div
                        key="extracted"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <h3 className="text-2xl font-semibold text-white mb-6 flex items-center space-x-2">
                          <Database className="h-6 w-6 text-purple-400" />
                          <span>Extracted Data</span>
                        </h3>
                        
                        {result?.extractedData ? (
                          <div className="space-y-6">
                            {/* Text Content */}
                            {result.extractedData.text && (
                              <div className="bg-white/5 rounded-xl p-6">
                                <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                                  <FileText className="h-5 w-5 text-blue-400" />
                                  <span>Text Content</span>
                                </h4>
                                <div className="bg-gray-800 rounded-lg p-4 max-h-60 overflow-y-auto">
                                  <p className="text-gray-300 text-sm whitespace-pre-wrap">
                                    {result.extractedData.text.substring(0, 1000)}
                                    {result.extractedData.text.length > 1000 && '...'}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Links */}
                            {result.extractedData.links && result.extractedData.links.length > 0 && (
                              <div className="bg-white/5 rounded-xl p-6">
                                <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                                  <Link className="h-5 w-5 text-green-400" />
                                  <span>Links ({result.extractedData.links.length})</span>
                                </h4>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                  {result.extractedData.links.slice(0, 20).map((link, index) => (
                                    <div key={index} className="flex items-center space-x-3 p-2 bg-gray-800 rounded-lg">
                                      <span className="text-gray-400 text-sm w-8">{index + 1}</span>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm truncate">{link.text}</p>
                                        <p className="text-gray-400 text-xs truncate">{link.url}</p>
                                      </div>
                                    </div>
                                  ))}
                                  {result.extractedData.links.length > 20 && (
                                    <p className="text-gray-400 text-sm text-center">
                                      ... and {result.extractedData.links.length - 20} more links
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Images */}
                            {result.extractedData.images && result.extractedData.images.length > 0 && (
                              <div className="bg-white/5 rounded-xl p-6">
                                <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                                  <Image className="h-5 w-5 text-yellow-400" />
                                  <span>Images ({result.extractedData.images.length})</span>
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-60 overflow-y-auto">
                                  {result.extractedData.images.slice(0, 12).map((image, index) => (
                                    <div key={index} className="bg-gray-800 rounded-lg p-3">
                                      <div className="aspect-square bg-gray-700 rounded-lg mb-2 flex items-center justify-center">
                                        <Image className="h-8 w-8 text-gray-400" />
                                      </div>
                                      <p className="text-white text-xs truncate">{image.alt || 'No alt text'}</p>
                                      <p className="text-gray-400 text-xs truncate">{image.src}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Custom Data */}
                            {result.extractedData.customData && Object.keys(result.extractedData.customData).length > 0 && (
                              <div className="bg-white/5 rounded-xl p-6">
                                <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                                  <Schema className="h-5 w-5 text-purple-400" />
                                  <span>Custom Schema Data</span>
                                </h4>
                                <div className="space-y-3">
                                  {Object.entries(result.extractedData.customData).map(([key, value], index) => (
                                    <div key={index} className="bg-gray-800 rounded-lg p-4">
                                      <h5 className="text-white font-medium mb-2">{key}</h5>
                                      <p className="text-gray-300 text-sm">
                                        {typeof value === 'string' ? value : JSON.stringify(value)}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <Database className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-400">No extracted data available. Enable data extraction options to see results here.</p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {activeTab === 'jobs' && (
                      <motion.div
                        key="jobs"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-2xl font-semibold text-white flex items-center space-x-2">
                            <History className="h-6 w-6 text-blue-400" />
                            <span>Job History</span>
                          </h3>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={loadJobHistory}
                            className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors duration-200"
                          >
                            Refresh
                          </motion.button>
                        </div>
                        
                        {jobs.length > 0 ? (
                          <div className="space-y-4">
                            {jobs.map((job, index) => {
                              const StatusIcon = getJobStatusIcon(job.status);
                              return (
                                <motion.div
                                  key={job.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="bg-white/5 rounded-xl p-6 border border-white/10"
                                >
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                      <StatusIcon className={`h-5 w-5 ${getJobStatusColor(job.status).split(' ')[0]}`} />
                                      <div>
                                        <h4 className="text-white font-medium">{job.url}</h4>
                                        <p className="text-gray-400 text-sm">
                                          {new Date(job.createdAt).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getJobStatusColor(job.status)}`}>
                                        {job.status}
                                      </span>
                                      {job.status === 'running' && (
                                        <span className="text-blue-300 text-sm">{job.progress}%</span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {job.status === 'running' && (
                                    <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${job.progress}%` }}
                                        transition={{ duration: 0.5 }}
                                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                                      />
                                    </div>
                                  )}
                                  
                                  {job.status === 'completed' && job.result && (
                                    <div className="flex items-center space-x-4">
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setResult(job.result!)}
                                        className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors duration-200"
                                      >
                                        View Results
                                      </motion.button>
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => generatePDFReport(job.result!)}
                                        className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors duration-200"
                                      >
                                        Download PDF
                                      </motion.button>
                                    </div>
                                  )}
                                  
                                  {job.status === 'failed' && job.error && (
                                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                                      <p className="text-red-300 text-sm">{job.error}</p>
                                    </div>
                                  )}
                                </motion.div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-400">No job history available. Start a background scraping job to see it here.</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* Terms of Use Modal */}
      <AnimatePresence>
        {showTermsOfUse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gray-900 rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-white/20"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Terms of Use</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowTermsOfUse(false)}
                  className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-white" />
                </motion.button>
              </div>

              <div className="space-y-6 text-gray-300">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Legal Boundaries</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Only scrape publicly available websites</li>
                    <li>• Respect robots.txt files and website terms of service</li>
                    <li>• Do not scrape personal or sensitive information</li>
                    <li>• Comply with applicable laws and regulations (GDPR, CCPA, etc.)</li>
                    <li>• Use reasonable crawl delays to avoid overwhelming servers</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Prohibited Uses</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Scraping copyrighted content without permission</li>
                    <li>• Automated attacks or denial of service</li>
                    <li>• Scraping login-protected or private content</li>
                    <li>• Commercial use without proper licensing</li>
                    <li>• Violating website terms of service</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">User Responsibility</h3>
                  <p className="text-sm">
                    You are responsible for ensuring your scraping activities comply with all applicable laws and website terms of service. 
                    This tool is provided for educational and research purposes. Always obtain proper permissions before scraping any website.
                  </p>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-white/10">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowTermsOfUse(false)}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors duration-200"
                  >
                    I Understand
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
