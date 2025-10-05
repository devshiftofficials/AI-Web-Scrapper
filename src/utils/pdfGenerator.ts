'use client';

import jsPDF from 'jspdf';

interface AnalysisData {
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

export function generatePDFReport(data: AnalysisData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Helper function to add text with word wrapping
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number) => {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + (lines.length * 7);
  };

  // Helper function to add a section
  const addSection = (title: string, content: string[], startY: number) => {
    let currentY = startY;
    
    // Check if we need a new page
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = 20;
    }
    
    // Add section title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 20, currentY);
    currentY += 10;
    
    // Add content
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    content.forEach((item) => {
      currentY = addWrappedText(`• ${item}`, 25, currentY, pageWidth - 45);
      currentY += 3;
    });
    
    return currentY + 10;
  };

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('AI Website Analysis Report', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date(data.analyzedAt).toLocaleString()}`, 20, yPosition);
  yPosition += 20;

  // Website Information
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Website Information', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  yPosition = addWrappedText(`URL: ${data.url}`, 20, yPosition, pageWidth - 40);
  yPosition += 5;
  yPosition = addWrappedText(`Title: ${data.title}`, 20, yPosition, pageWidth - 40);
  yPosition += 5;
  yPosition = addWrappedText(`Description: ${data.description}`, 20, yPosition, pageWidth - 40);
  yPosition += 15;

  // Performance Analysis
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Performance Analysis', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  yPosition = addWrappedText(`Load Time: ${data.performance.loadTime}ms`, 20, yPosition, pageWidth - 40);
  yPosition += 5;
  yPosition = addWrappedText(`Performance Score: ${data.performance.score}/100`, 20, yPosition, pageWidth - 40);
  yPosition += 5;
  yPosition = addWrappedText(`First Paint: ${data.performance.metrics.firstPaint}ms`, 20, yPosition, pageWidth - 40);
  yPosition += 5;
  yPosition = addWrappedText(`First Contentful Paint: ${data.performance.metrics.firstContentfulPaint}ms`, 20, yPosition, pageWidth - 40);
  yPosition += 5;
  yPosition = addWrappedText(`DOM Content Loaded: ${data.performance.metrics.domContentLoaded}ms`, 20, yPosition, pageWidth - 40);
  yPosition += 15;

  // Technologies
  if (data.technologies.length > 0) {
    yPosition = addSection('Technologies Detected', data.technologies, yPosition);
  }

  // Programming Languages
  if (data.languages && data.languages.length > 0) {
    yPosition = addSection('Programming Languages', data.languages, yPosition);
  }

  // SEO Analysis
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SEO Analysis', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  yPosition = addWrappedText(`SEO Score: ${data.seo.score}/100`, 20, yPosition, pageWidth - 40);
  yPosition += 10;

  if (data.seo.issues.length > 0) {
    yPosition = addSection('SEO Issues', data.seo.issues, yPosition);
  }

  if (data.seo.improvements.length > 0) {
    yPosition = addSection('SEO Improvements', data.seo.improvements, yPosition);
  }

  // AI Insights
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('AI-Powered Insights', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  yPosition = addWrappedText(`Sentiment: ${data.aiInsights.sentiment}`, 20, yPosition, pageWidth - 40);
  yPosition += 5;
  yPosition = addWrappedText(`Complexity: ${data.aiInsights.complexity}`, 20, yPosition, pageWidth - 40);
  yPosition += 5;
  yPosition = addWrappedText(`Accessibility: ${data.aiInsights.accessibility}`, 20, yPosition, pageWidth - 40);
  yPosition += 5;
  yPosition = addWrappedText(`Security: ${data.aiInsights.security}`, 20, yPosition, pageWidth - 40);
  yPosition += 15;

  // Recommendations
  if (data.recommendations.length > 0) {
    yPosition = addSection('AI Recommendations', data.recommendations, yPosition);
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
    doc.text('Generated by AI Web Scraper', 20, pageHeight - 10);
  }

  // Save the PDF
  doc.save(`website-analysis-${new Date().toISOString().split('T')[0]}.pdf`);
}

export function generateJSONReport(data: AnalysisData): void {
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `website-analysis-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
