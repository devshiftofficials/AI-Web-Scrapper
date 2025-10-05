'use client';

import { useState } from 'react';
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
  Activity
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
  analyzedAt: string;
}

export default function Dashboard() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScrapingResult | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const handleScrape = async () => {
    if (!url) {
      toast.error('Please enter a URL');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/scraper/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze website');
      }

      setResult(data);
      toast.success('Website analyzed successfully with AI!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze website. Please try again.';
      toast.error(errorMessage);
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Globe },
    { id: 'performance', name: 'Performance', icon: Zap },
    { id: 'technologies', name: 'Technologies', icon: Code },
    { id: 'seo', name: 'SEO Analysis', icon: Target },
    { id: 'ai', name: 'AI Insights', icon: Brain },
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
          className="max-w-4xl mx-auto mb-12"
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
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleScrape}
                disabled={isLoading}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg"
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="rounded-full h-5 w-5 border-2 border-white border-t-transparent"
                    />
                    <span>AI Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Brain className="h-5 w-5" />
                    <span>Analyze with AI</span>
                  </>
                )}
              </motion.button>
            </div>
            
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
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </div>
  );
}
