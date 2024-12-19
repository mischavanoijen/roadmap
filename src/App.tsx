import React, { useEffect } from 'react';
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

function Header() {
  const [showModal, setShowModal] = React.useState(false);
  const [report, setReport] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const { items, categorySettings } = useRoadmapStore();

  const generateReport = async () => {
    setLoading(true);
    setShowModal(true);
    setReport('Generating report...');

    try {
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

      // Call Azure OpenAI
      const url = `${import.meta.env.VITE_AZURE_OPENAI_ENDPOINT}/openai/deployments/${
        import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT_NAME
      }/chat/completions?api-version=2023-05-15`;

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
              content: `Please analyze this roadmap data and create a customer-focused use-case analysis that emphasizes business value and practical applications for business users:\n\n${prompt}`
            }
          ],
          temperature: 0.2,
          max_tokens: 2500,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
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
      setLoading(false);
    }
  };

  const exportToPng = async () => {
    const content = document.getElementById('timeline-content');
    if (!content) return;

    // Create a clone of the content to modify for export
    const clone = content.cloneNode(true) as HTMLElement;
    
    // Add title and date at the top
    const titleDiv = document.createElement('div');
    titleDiv.className = 'text-slate-100 text-2xl font-bold mb-4 px-16 pt-8';
    titleDiv.textContent = 'Liza Product Roadmap 2025';
    
    const dateDiv = document.createElement('div');
    dateDiv.className = 'text-slate-400 text-sm mb-8 px-16';
    dateDiv.textContent = `Last updated: ${new Date().toLocaleDateString()}`;
    
    clone.insertBefore(dateDiv, clone.firstChild);
    clone.insertBefore(titleDiv, clone.firstChild);

    // Hide "Add Category" button in export
    const addCategoryButton = clone.querySelector('[data-testid="add-category-button"]');
    if (addCategoryButton) {
      addCategoryButton.remove();
    }

    // Create a container with white background
    const container = document.createElement('div');
    container.style.backgroundColor = 'rgb(15, 23, 42)'; // bg-slate-900
    container.style.padding = '0';
    container.style.margin = '0';
    container.appendChild(clone);

    // Add the container to the document temporarily
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        backgroundColor: 'rgb(15, 23, 42)', // bg-slate-900
        scale: 2,
      });

      // Convert to PNG and download
      const link = document.createElement('a');
      link.download = 'roadmap.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      // Clean up
      document.body.removeChild(container);
    }
  };

  return (
    <header className="sticky top-0 bg-slate-900 border-b border-slate-700 z-40">
      <div className="max-w-[1600px] mx-auto p-2">
        <div className="flex items-center justify-between px-16">
          <div className="flex items-center gap-4">
            <img src="/Atos globe blue.png" alt="Atos" className="h-6 w-6" />
            <h1 className="text-xl font-semibold text-slate-100">
              Liza Product Roadmap 2025
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={exportToPng}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-md transition-colors text-sm"
            >
              Export PNG
            </button>
            <button
              onClick={generateReport}
              disabled={loading}
              className={clsx(
                'px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-md transition-colors text-sm',
                loading && 'opacity-50 cursor-not-allowed'
              )}
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-slate-100">Roadmap Report</h2>
              <div className="flex items-center gap-4">
                <CopyButton text={report} />
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-300"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown>{report}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}
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
  const { initialize, initialized } = useRoadmapStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-slate-100">Loading...</div>
      </div>
    );
  }

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