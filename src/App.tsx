import React from 'react';
import { TimelineView } from './components/TimelineView';
import { useRoadmapStore } from './store/roadmapStore';
import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-md transition-colors text-sm"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function Modal({ isOpen, onClose, children }: { 
  isOpen: boolean; 
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex-1 overflow-auto">
          {typeof children === 'string' ? (
            <ReactMarkdown
              components={{
                h1: ({...props}) => <h1 className="text-2xl font-bold mt-8 mb-4 text-slate-100" {...props} />,
                h2: ({...props}) => <h2 className="text-xl font-bold mt-6 mb-3 text-slate-100" {...props} />,
                h3: ({...props}) => <h3 className="text-lg font-bold mt-4 mb-2 text-slate-100" {...props} />,
                h4: ({...props}) => <h4 className="text-base font-bold mt-3 mb-2 text-slate-100" {...props} />,
                p: ({...props}) => <p className="mb-4 text-slate-300" {...props} />,
                ul: ({...props}) => <ul className="list-disc pl-6 mb-4 text-slate-300" {...props} />,
                ol: ({...props}) => <ol className="list-decimal pl-6 mb-4 text-slate-300" {...props} />,
                li: ({...props}) => <li className="mb-1 text-slate-300" {...props} />,
                strong: ({...props}) => <strong className="font-bold text-slate-100" {...props} />,
                em: ({...props}) => <em className="italic text-slate-200" {...props} />,
                blockquote: ({...props}) => (
                  <blockquote className="border-l-4 border-slate-600 pl-4 my-4 text-slate-400" {...props} />
                ),
                code: ({...props}) => (
                  <code className="bg-slate-700 px-1.5 py-0.5 rounded text-slate-200" {...props} />
                ),
                pre: ({...props}) => (
                  <pre className="bg-slate-700 p-4 rounded-lg overflow-x-auto mb-4" {...props} />
                ),
              }}
              className="prose prose-invert max-w-none p-6"
            >
              {children}
            </ReactMarkdown>
          ) : (
            <div className="p-6">
              <div className="text-slate-300">{children}</div>
            </div>
          )}
        </div>
        <div className="border-t border-slate-700 p-4 flex justify-end gap-3 bg-slate-800">
          <CopyButton text={typeof children === 'string' ? children : ''} />
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Header() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [report, setReport] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isExportingDoc, setIsExportingDoc] = React.useState(false);
  const { items, categorySettings } = useRoadmapStore();

  const exportToPng = async () => {
    setIsExporting(true);
    try {
      const timelineElement = document.getElementById('timeline-content');
      if (!timelineElement) {
        throw new Error('Timeline element not found');
      }

      // Hide add category button during export
      const addCategoryButton = timelineElement.querySelector('.add-category-button');
      if (addCategoryButton) {
        addCategoryButton.classList.add('hidden');
      }

      // Create and insert temporary title header
      const titleHeader = document.createElement('div');
      titleHeader.className = 'flex justify-between items-center px-4 py-3 bg-slate-900 border-b border-slate-700 mb-4';
      titleHeader.innerHTML = `
        <h1 class="text-xl font-semibold text-slate-100">Liza Product Roadmap 2025</h1>
        <span class="text-sm text-slate-400">Last updated: ${new Date().toLocaleDateString()}</span>
      `;
      timelineElement.insertBefore(titleHeader, timelineElement.firstChild);

      const canvas = await html2canvas(timelineElement, {
        backgroundColor: '#1e293b', // bg-slate-800
        scale: 2, // Higher resolution
        logging: false,
        windowWidth: timelineElement.scrollWidth,
        windowHeight: timelineElement.scrollHeight,
      });

      // Cleanup: remove temporary elements and restore visibility
      titleHeader.remove();
      if (addCategoryButton) {
        addCategoryButton.classList.remove('hidden');
      }

      // Create download link
      const link = document.createElement('a');
      link.download = `Liza-Roadmap-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error exporting to PNG:', error);
      alert('Failed to export roadmap. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToDoc = async () => {
    setIsExportingDoc(true);
    try {
      // Always generate a fresh report
      setIsLoading(true);
      await generateReport();
      setIsLoading(false);

      // Then generate the PNG
      const timelineElement = document.getElementById('timeline-content');
      if (!timelineElement) {
        throw new Error('Timeline element not found');
      }

      // Hide add category button during export
      const addCategoryButton = timelineElement.querySelector('.add-category-button');
      if (addCategoryButton) {
        addCategoryButton.classList.add('hidden');
      }

      // Create and insert temporary title header
      const titleHeader = document.createElement('div');
      titleHeader.className = 'flex justify-between items-center px-4 py-3 bg-slate-900 border-b border-slate-700 mb-4';
      titleHeader.innerHTML = `
        <h1 class="text-xl font-semibold text-slate-100">Liza Product Roadmap 2025</h1>
        <span class="text-sm text-slate-400">Last updated: ${new Date().toLocaleDateString()}</span>
      `;
      timelineElement.insertBefore(titleHeader, timelineElement.firstChild);

      const canvas = await html2canvas(timelineElement, {
        backgroundColor: '#1e293b',
        scale: 2,
        logging: false,
        windowWidth: timelineElement.scrollWidth,
        windowHeight: timelineElement.scrollHeight,
      });

      // Cleanup: remove temporary elements and restore visibility
      titleHeader.remove();
      if (addCategoryButton) {
        addCategoryButton.classList.remove('hidden');
      }

      // Convert canvas to base64 image
      const imageDataUrl = canvas.toDataURL('image/png');

      // Format the report text with proper HTML
      const formattedReport = report
        .replace(/# (.*?)\n/g, '<h1>$1</h1>\n')
        .replace(/## (.*?)\n/g, '<h2>$1</h2>\n')
        .replace(/### (.*?)\n/g, '<h3>$1</h3>\n')
        .replace(/\n- (.*?)(?=\n|$)/g, '\n<li>$1</li>')
        .replace(/(?<=<li>.*)\n{2}(.*?)(?=\n|$)/g, '<br>$1')
        .split('\n\n').map(section => 
          section.includes('<li>') 
            ? `<ul>${section}</ul>` 
            : `<p>${section}</p>`
        ).join('\n')
        .replace(/\n(?!<)/g, '<br>');

      // Create Word-compatible HTML document with mso (Microsoft Office) specific styles
      const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
        <head>
          <meta charset="utf-8">
          <title>Liza Product Roadmap 2025</title>
          <style>
            @page {
              size: A4;
              margin: 1in;
            }
            body {
              font-family: Calibri, Arial, sans-serif;
              font-size: 11pt;
              line-height: 1.3;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 100%;
              margin: 0;
              padding: 0;
            }
            h1 {
              font-size: 18pt;
              color: #1a365d;
              margin: 12pt 0 6pt 0;
              padding: 0;
              font-weight: bold;
              page-break-before: always;
            }
            h1:first-child {
              page-break-before: avoid;
            }
            h2 {
              font-size: 14pt;
              color: #2c5282;
              margin: 10pt 0 6pt 0;
              padding: 0;
              font-weight: bold;
            }
            h3 {
              font-size: 12pt;
              color: #2b6cb0;
              margin: 8pt 0 4pt 0;
              padding: 0;
              font-weight: bold;
            }
            p {
              margin: 6pt 0;
              padding: 0;
            }
            ul {
              margin: 6pt 0 6pt 24pt;
              padding: 0;
            }
            li {
              margin: 3pt 0;
              padding: 0;
            }
            .roadmap-image {
              width: 100%;
              margin: 12pt 0;
              page-break-inside: avoid;
            }
            .date {
              color: #666666;
              margin-bottom: 12pt;
            }
            .report {
              margin-top: 12pt;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Liza Product Roadmap 2025</h1>
            <p class="date">Last updated: ${new Date().toLocaleDateString()}</p>
            
            <div class="roadmap-image">
              <img src="${imageDataUrl}" alt="Roadmap Timeline" style="width: 100%; height: auto;">
            </div>
            
            <div class="report">
              ${formattedReport}
            </div>
          </div>
        </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob([htmlContent], { 
        type: 'application/vnd.ms-word;charset=utf-8'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Liza-Roadmap-${new Date().toISOString().split('T')[0]}.doc`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to Word:', error);
      alert('Failed to export document. Please try again.');
    } finally {
      setIsExportingDoc(false);
    }
  };

  const generateReport = async () => {
    setIsModalOpen(true);
    setIsLoading(true);
    setReport('Generating report...');
    
    try {
      // Log configuration
      console.log('Azure OpenAI Configuration:', {
        endpoint: import.meta.env.VITE_AZURE_OPENAI_ENDPOINT,
        deploymentName: import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT_NAME,
        hasApiKey: !!import.meta.env.VITE_AZURE_OPENAI_API_KEY,
      });

      // Format the roadmap data
      const roadmapData = {
        categories: Object.entries(categorySettings).map(([id, settings]) => ({
          id,
          name: settings.name,
          items: items.filter(item => item.category === id).map(item => ({
            title: item.title,
            description: item.description,
            quarter: item.quarter
          }))
        }))
      };

      // Format the prompt
      let prompt = 'Here is the product roadmap data:\n\n';
      roadmapData.categories.forEach(category => {
        prompt += `## ${category.name}\n\n`;
        ['Q1', 'Q2', 'Q3', 'Q4'].forEach(quarter => {
          const quarterItems = category.items.filter(item => item.quarter === quarter);
          if (quarterItems.length > 0) {
            prompt += `${quarter}:\n`;
            quarterItems.forEach(item => {
              prompt += `- ${item.title}\n`;
              if (item.description) {
                prompt += `  ${item.description}\n`;
              }
            });
            prompt += '\n';
          }
        });
      });

      console.log('Making request to Azure OpenAI...');
      
      // Call Azure OpenAI
      const url = `${import.meta.env.VITE_AZURE_OPENAI_ENDPOINT}/openai/deployments/${
        import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT_NAME
      }/chat/completions?api-version=2023-05-15`;

      console.log('Request URL:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': import.meta.env.VITE_AZURE_OPENAI_API_KEY,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are an expert in creating customer-focused use-case roadmaps for enterprise AI platforms. Your task is to analyze the provided roadmap data and create a comprehensive roadmap for Liza, an enterprise AI platform. The analysis should:

1. Group deliverables by quarter (Q1-Q4 2025)
2. Map technical features to tangible customer benefits and use cases

Format the response with clear markdown sections:
# Executive Summary

# Quarterly Breakdown
## Q1 2025
### Customer Benefits
### Customer use cases

## Q2 2025
### Customer Benefits
### Customer use cases

## Q3 2025
### Customer Benefits
### Customer use cases

## Q4 2025
### Customer Benefits
### Customer use cases`
            },
            {
              role: 'user',
              content: `Please analyze this roadmap data and create a customer-focused use-case analysis that emphasizes business value and practical applications ofr business users:\n\n${prompt}`
            }
          ],
          temperature: 0.2,
          max_tokens: 2500,
          stream: true,
        }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Azure OpenAI Error:', errorData);
        throw new Error(
          errorData?.error?.message || 
          `Failed to generate report: ${response.status} ${response.statusText}`
        );
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          try {
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = JSON.parse(line.slice(6));
                if (data.choices[0].delta?.content) {
                  fullText += data.choices[0].delta.content;
                  setReport(fullText);
                }
              }
            }
          } catch (e) {
            console.warn('Error parsing chunk:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error generating report:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setReport(`Failed to generate report: ${errorMessage}\n\nPlease check the browser console for more details.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <header className="sticky top-0 bg-slate-900 border-b border-slate-700 z-40">
      <div className="max-w-[1600px] mx-auto p-2">
        <div className="flex items-center justify-between h-10">
          <div className="flex items-center gap-3 pl-16">
            <img src="/Atos globe blue.png" alt="Atos" className="h-7 w-7" />
            <h1 className="text-lg font-semibold text-slate-100">Liza Product Roadmap 2025</h1>
          </div>
          <div className="flex items-center gap-4 pr-16">
            <button
              onClick={exportToDoc}
              disabled={isExportingDoc}
              className={clsx(
                "px-4 py-2 rounded-md transition-colors text-sm font-medium",
                isExportingDoc
                  ? "bg-slate-600 text-slate-300 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              )}
            >
              {isExportingDoc ? 'Exporting...' : 'Export Word'}
            </button>
            <button
              onClick={exportToPng}
              disabled={isExporting}
              className={clsx(
                "px-4 py-2 rounded-md transition-colors text-sm font-medium",
                isExporting
                  ? "bg-slate-600 text-slate-300 cursor-not-allowed"
                  : "bg-violet-600 hover:bg-violet-500 text-white"
              )}
            >
              {isExporting ? 'Exporting...' : 'Export PNG'}
            </button>
            <button
              onClick={generateReport}
              disabled={isLoading}
              className={clsx(
                "px-4 py-2 rounded-md transition-colors text-sm font-medium",
                isLoading 
                  ? "bg-slate-600 text-slate-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-500 text-white"
              )}
            >
              {isLoading ? 'Generating...' : 'Generate Report'}
            </button>
            <span className="text-sm text-slate-400">Last updated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {report}
      </Modal>
    </header>
  );
}

function Footer() {
  return (
    <footer className="sticky bottom-0 bg-slate-900 border-t border-slate-700 z-40">
      <div className="max-w-[1600px] mx-auto p-4">
        <div className="flex items-center justify-between px-16">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} Atos. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <button className="text-sm text-slate-400 hover:text-slate-200 transition-colors">Help</button>
            <button className="text-sm text-slate-400 hover:text-slate-200 transition-colors">Privacy</button>
            <button className="text-sm text-slate-400 hover:text-slate-200 transition-colors">Terms</button>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function App() {
  return (
    <div className="min-h-screen bg-slate-800 flex flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <div id="timeline-content" className="max-w-[1600px] mx-auto">
          <TimelineView />
        </div>
      </main>
      <Footer />
    </div>
  );
}