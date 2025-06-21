'use client';

import { Document, Page, pdfjs } from 'react-pdf';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Download, Printer, ZoomIn, ZoomOut, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `./pdf.worker.min.js`;

export default function ResumePage() {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const documentOptions = useMemo(() => ({
    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/',
  }), []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    pageRefs.current = new Array(numPages);
  }

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollAreaRef.current) return;
      
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (!scrollContainer) return;

      const scrollTop = scrollContainer.scrollTop;
      const containerHeight = scrollContainer.clientHeight;
      const scrollCenter = scrollTop + containerHeight / 2;

      for (let i = 0; i < pageRefs.current.length; i++) {
        const pageElement = pageRefs.current[i];
        if (pageElement) {
          const rect = pageElement.getBoundingClientRect();
          const containerRect = scrollContainer.getBoundingClientRect();
          const pageTop = rect.top - containerRect.top + scrollTop;
          const pageBottom = pageTop + rect.height;

          if (scrollCenter >= pageTop && scrollCenter <= pageBottom) {
            setCurrentPage(i + 1);
            break;
          }
        }
      }
    };

    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [numPages]);

  const scrollToPage = (pageNum: number) => {
    const pageElement = pageRefs.current[pageNum - 1];
    if (pageElement && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const pageRect = pageElement.getBoundingClientRect();
        const scrollTop = scrollContainer.scrollTop;
        const targetScroll = pageRect.top - containerRect.top + scrollTop - 100;
        
        scrollContainer.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        });
      }
    }
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/resume.pdf';
    link.download = 'resume.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      scrollToPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < numPages) {
      scrollToPage(currentPage + 1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 right-4 z-20">
        <div className="bg-accent/50 border rounded-full flex items-center gap-1 shadow-md p-1">
          <Button 
            onClick={handlePrint}
            variant="ghost"
            size="icon"
          >
            <Printer className="w-4 h-4" />
          </Button>
          <Button 
            onClick={handleDownload}
            variant="ghost"
            size="icon"
          >
            <Download className="w-4 h-4" />
          </Button>
          <div className="w-px h-5 bg-border mx-1" />
          <Button 
            onClick={() => window.open('https://sohamdatta.com', '_blank')}
            variant="ghost"
            className="h-8 px-3 text-sm gap-2"
          >
            My Website
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Viewer with Scroll */}
      <div className="h-screen">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="flex flex-col items-center gap-4 px-8 pt-20 pb-28">
            <Document
              file="/resume.pdf"
              onLoadSuccess={onDocumentLoadSuccess}
              options={documentOptions}
              loading={
                <div className="flex items-center justify-center py-20">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-pulse"></div>
                      <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <div className="text-sm text-muted-foreground/70 font-medium">Loading</div>
                  </div>
                </div>
              }
              error={
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <p className="text-destructive mb-2">Failed to load PDF</p>
                    <p className="text-sm text-muted-foreground">Please check if the file exists</p>
                  </div>
                </div>
              }
            >
              {Array.from(new Array(numPages), (el, index) => (
                <div 
                  key={`page_${index + 1}`} 
                  className="mb-4 last:mb-0"
                  ref={(el) => { pageRefs.current[index] = el; }}
                >
                  <div className="bg-card shadow-lg rounded-lg overflow-hidden">
                    <Page
                      pageNumber={index + 1}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      width={800 * scale}
                      loading={
                        <div className="flex items-center justify-center p-12 bg-card">
                          <div className="w-6 h-6 border border-muted-foreground/30 border-t-primary rounded-full animate-spin"></div>
                        </div>
                      }
                    />
                  </div>
                </div>
              ))}
            </Document>
          </div>
        </ScrollArea>
      </div>

      {/* Bottom Floating Toolbar */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20">
        <div className="bg-card border border-border text-card-foreground px-4 py-2 rounded-full flex items-center gap-3 shadow-lg">
          {/* Page Navigation */}
          <button 
            onClick={goToPreviousPage}
            disabled={currentPage <= 1}
            className="p-1 hover:bg-accent hover:text-accent-foreground rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-1 text-sm">
            <span className="text-muted-foreground">Page</span>
            <input
              type="number"
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= numPages) {
                  scrollToPage(page);
                }
              }}
              className="text-center bg-transparent border-none outline-none font-medium text-card-foreground"
              min="1"
              max={numPages}
            />
            <span className="text-muted-foreground mr-2">/</span>
            <span className="text-muted-foreground">{numPages}</span>
          </div>
          
          <button 
            onClick={goToNextPage}
            disabled={currentPage >= numPages}
            className="p-1 hover:bg-accent hover:text-accent-foreground rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-border mx-2" />

          {/* Zoom Controls */}
          <button
            onClick={zoomOut}
            className="p-1 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <span className="text-sm text-card-foreground px-2 min-w-[3.5rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <button
            onClick={zoomIn}
            className="p-1 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
