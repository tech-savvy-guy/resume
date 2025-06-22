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
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const documentOptions = useMemo(() => ({
    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/',
  }), []);

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    // Set initial window width
    setWindowWidth(window.innerWidth);
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate responsive PDF width
  const getPDFWidth = () => {
    if (windowWidth === 0) return 800; // Default fallback
    
    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1024;
    
    if (isMobile) {
      return Math.min(windowWidth - 32, 600) * scale; // 16px padding on each side
    } else if (isTablet) {
      return Math.min(windowWidth - 64, 700) * scale; // 32px padding on each side
    } else {
      return 800 * scale; // Desktop
    }
  };

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

  const isMobile = windowWidth < 768;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navbar - Responsive - Only show when PDF is loaded */}
      {numPages > 0 && (
        <div className={`bg-background fixed top-0 left-0 right-0 z-20 flex justify-end ${isMobile ? 'p-2' : 'p-4'}`}>
          <div className={`bg-accent/50 border rounded-full flex items-center shadow-md p-1 ${isMobile ? 'gap-0.5' : 'gap-1'}`}>
            <Button 
              onClick={handlePrint}
              variant="ghost"
              size={isMobile ? "sm" : "icon"}
              className={isMobile ? "h-7 w-7 p-0" : ""}
            >
              <Printer className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
            </Button>
            <Button 
              onClick={handleDownload}
              variant="ghost"
              size={isMobile ? "sm" : "icon"}
              className={isMobile ? "h-7 w-7 p-0" : ""}
            >
              <Download className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
            </Button>
            <div className={`bg-border ${isMobile ? 'w-px h-4 mx-0.5' : 'w-px h-5 mx-1'}`} />
            <Button 
              onClick={() => window.open('https://sohamdatta.com', '_blank')}
              variant="ghost"
              className={`gap-1 ${isMobile ? 'h-7 px-2 text-xs' : 'h-8 px-3 text-sm gap-2'}`}
            >
              {isMobile ? 'Site' : 'My Website'}
              <ExternalLink className={`${isMobile ? 'w-2.5 h-2.5' : 'w-4 h-4'}`} />
            </Button>
          </div>
        </div>
      )}

      {/* PDF Viewer with Scroll */}
      <div className="h-screen">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className={`flex flex-col items-center gap-4 pb-32 ${isMobile ? 'px-4 pt-8' : 'px-8 pt-8'}`}>
            <Document
              file="/resume.pdf"
              onLoadSuccess={onDocumentLoadSuccess}
              options={documentOptions}
              loading={
                <div className="fixed inset-0 flex items-center justify-center bg-background">
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
                  className={`last:mb-0 ${isMobile ? 'mb-2' : 'mb-4'}`}
                  ref={(el) => { pageRefs.current[index] = el; }}
                >
                  <div className="bg-card shadow-lg rounded-lg overflow-hidden">
                    <Page
                      pageNumber={index + 1}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      width={getPDFWidth()}
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

      {/* Bottom Floating Toolbar - Responsive - Only show when PDF is loaded */}
      {numPages > 0 && (
        <div className={`fixed z-20 ${
          isMobile 
            ? 'bottom-3 left-1/2 transform -translate-x-1/2' 
            : 'bottom-6 left-1/2 transform -translate-x-1/2'
        }`}>
          <div className={`bg-card border border-border text-card-foreground rounded-full flex items-center shadow-lg ${
            isMobile 
              ? 'px-2.5 py-1.5 gap-2' 
              : 'px-3 py-2 gap-2.5'
          }`}>
            {/* Page Navigation */}
            <div className="flex items-center gap-0.5">
              <button 
                onClick={goToPreviousPage}
                disabled={currentPage <= 1}
                className={`hover:bg-accent hover:text-accent-foreground rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                  isMobile ? 'p-1' : 'p-1'
                }`}
              >
                <ChevronUp className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
              </button>
              
              <div className={`flex items-center gap-0.5 ${isMobile ? 'text-xs mx-1' : 'text-sm mx-1'}`}>
                {!isMobile && <span className="text-muted-foreground text-xs">Page</span>}
                <input
                  type="number"
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= numPages) {
                      scrollToPage(page);
                    }
                  }}
                  className={`text-center bg-transparent border-none outline-none font-medium text-card-foreground ${
                    isMobile ? 'w-6' : 'w-7'
                  }`}
                  min="1"
                  max={numPages}
                />
                <span className="text-muted-foreground">/</span>
                <span className="text-muted-foreground">{numPages}</span>
              </div>
              
              <button 
                onClick={goToNextPage}
                disabled={currentPage >= numPages}
                className={`hover:bg-accent hover:text-accent-foreground rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                  isMobile ? 'p-1' : 'p-1'
                }`}
              >
                <ChevronDown className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
              </button>
            </div>

            <div className={`bg-border ${isMobile ? 'w-px h-4' : 'w-px h-5'}`} />

            {/* Zoom Controls */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={zoomOut}
                className={`hover:bg-accent hover:text-accent-foreground rounded transition-colors ${
                  isMobile ? 'p-1' : 'p-1'
                }`}
              >
                <ZoomOut className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
              </button>
              
              <span className={`text-card-foreground text-center font-medium ${
                isMobile ? 'text-xs px-1 min-w-[2rem]' : 'text-sm px-1.5 min-w-[2.5rem]'
              }`}>
                {Math.round(scale * 100)}%
              </span>
              
              <button
                onClick={zoomIn}
                className={`hover:bg-accent hover:text-accent-foreground rounded transition-colors ${
                  isMobile ? 'p-1' : 'p-1'
                }`}
              >
                <ZoomIn className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
