import * as pdfjsLibModule from 'pdfjs-dist';

// Handle potential default export structure from CDNs (esm.sh often wraps it)
const pdfjsLib = (pdfjsLibModule as any).default || pdfjsLibModule;

// Initialize the worker
if (pdfjsLib.GlobalWorkerOptions) {
  // Use cdnjs for the worker as it is a reliable static host for the worker script
  // ensuring the version matches the imported library (3.11.174)
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

export interface PDFDocumentProxy {
  numPages: number;
  getPage: (pageNumber: number) => Promise<any>;
}

export const loadPdfDocument = async (file: File): Promise<PDFDocumentProxy> => {
  const arrayBuffer = await file.arrayBuffer();
  // Use the local pdfjsLib variable which handles the default export
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  return await loadingTask.promise;
};

export const renderPageAsImage = async (pdf: PDFDocumentProxy, pageNum: number, scale = 1.5): Promise<string> => {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) throw new Error("Could not create canvas context");
  
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  
  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };
  
  await page.render(renderContext).promise;
  return canvas.toDataURL('image/jpeg', 0.85); // 85% quality JPEG
};

export const extractTextFromPage = async (pdf: PDFDocumentProxy, pageNum: number): Promise<string> => {
  const page = await pdf.getPage(pageNum);
  const textContent = await page.getTextContent();
  return textContent.items.map((item: any) => item.str).join(' ');
};

// Smart selection algorithm
export const findMostRelevantPages = async (
  pdf: PDFDocumentProxy, 
  topic: string, 
  maxPages: number = 5
): Promise<number[]> => {
  const scores: { page: number; score: number }[] = [];
  const searchTerms = topic.toLowerCase().split(' ').filter(t => t.length > 3);

  // Heuristic: If PDF is massive, we scan chunks or random pages if we can't scan all.
  // For < 50 pages, scan all. For > 50, scan TOC + spread.
  // Implementing a simplified scan for now: Scan first 20 pages + random 30 others to save time
  const pagesToScan = new Set<number>();
  for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) pagesToScan.add(i);
  for (let i = 0; i < 30; i++) {
    const p = Math.floor(Math.random() * pdf.numPages) + 1;
    pagesToScan.add(p);
  }
  
  const scanList = Array.from(pagesToScan).sort((a, b) => a - b);

  for (const pageNum of scanList) {
    try {
      const text = (await extractTextFromPage(pdf, pageNum)).toLowerCase();
      let score = 0;
      searchTerms.forEach(term => {
        const matches = text.split(term).length - 1;
        score += matches;
      });
      if (score > 0) {
        scores.push({ page: pageNum, score });
      }
    } catch (e) {
      console.warn(`Failed to scan page ${pageNum}`, e);
    }
  }

  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, maxPages)
    .map(s => s.page);
};