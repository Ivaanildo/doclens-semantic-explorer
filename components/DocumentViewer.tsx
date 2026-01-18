
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Rect } from '../types';

interface DocumentViewerProps {
  documentData: string | null;
  onRegionSelected: (imageData: string, pageNumber: number, rect: Rect, prompt?: string, isRemix?: boolean) => void;
  onTextExtracted: (text: string) => void;
  onUploadFile?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenMap?: () => void;
}

const STYLE_CHIPS = [
    { label: "Arrows & Terms", prompt: "Add arrows explaining terms" },
    { label: "Tech Annotations", prompt: "Generate version with technical annotations" },
    { label: "Formula Map", prompt: "Highlight formulas and name variables" },
    { label: "Semantic Balloons", prompt: "baloes apontando para termos e conceitos com busca semantica por cores e legendas explicativas coloriadas" }
];

const DocumentViewer: React.FC<DocumentViewerProps> = ({ documentData, onRegionSelected, onTextExtracted, onUploadFile, onOpenMap }) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.0); 
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [selection, setSelection] = useState<Rect | null>(null);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!documentData) return;
    const loadPdf = async () => {
      setIsLoading(true);
      try {
        const loadingTask = window.pdfjsLib.getDocument(documentData);
        const pdf = await loadingTask.promise;
        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);
        setCurrentPage(1);
        renderPage(1);
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };
    loadPdf();
  }, [documentData]);

  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDocRef.current || !canvasRef.current) return;
    if (renderTaskRef.current) await renderTaskRef.current.cancel();
    const page = await pdfDocRef.current.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    renderTaskRef.current = page.render({ canvasContext: context, viewport });
    try { await renderTaskRef.current.promise; } catch (e) {}
  }, [scale]);

  useEffect(() => { if (pdfDocRef.current) renderPage(currentPage); }, [currentPage, scale, renderPage]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!documentData || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setIsDrawing(true); setStartPos(pos);
    setSelection({ x: pos.x, y: pos.y, width: 0, height: 0 });
    setCustomPrompt('');
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !startPos || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setSelection({
      x: Math.min(pos.x, startPos.x),
      y: Math.min(pos.y, startPos.y),
      width: Math.abs(pos.x - startPos.x),
      height: Math.abs(pos.y - startPos.y),
    });
  };

  const handleMouseUp = () => setIsDrawing(false);

  const handleCapture = (isRemix: boolean = false) => {
    if (!selection || selection.width < 10 || selection.height < 10 || !canvasRef.current) {
        setSelection(null); return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = selection.width; canvas.height = selection.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(canvasRef.current, selection.x, selection.y, selection.width, selection.height, 0, 0, selection.width, selection.height);
      onRegionSelected(canvas.toDataURL('image/png'), currentPage, selection, customPrompt, isRemix);
      setSelection(null);
    }
  };

  const DeploymentTargetModal = () => (
    <div className={`
      bg-white border border-slate-100 shadow-[0_40px_100px_rgba(0,0,0,0.25)] 
      flex flex-col animate-in zoom-in-95 fade-in duration-500 overflow-hidden pointer-events-auto
      ${isMobile 
        ? 'fixed bottom-0 left-0 right-0 rounded-t-[2.5rem] z-[100] max-h-[85vh] p-6 pb-10' 
        : 'absolute top-full left-1/2 -translate-x-1/2 mt-6 w-[340px] rounded-[2.5rem] p-6 z-50 origin-top'
      }
    `}>
      <div className="flex flex-col space-y-5">
        {isMobile && <div className="w-12 h-1 bg-slate-100 rounded-full mx-auto mb-4 shrink-0"></div>}
        
        <div className="flex justify-between items-center shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Deployment Target</span>
            <span className="text-[8px] font-bold text-blue-500 uppercase tracking-widest mt-0.5">Intelligence Lab</span>
          </div>
          <button onClick={() => setSelection(null)} className="text-slate-300 hover:text-slate-500 p-2 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-3 shrink-0">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Custom Visual Directives</span>
            <textarea 
              value={customPrompt} 
              onChange={(e) => setCustomPrompt(e.target.value)} 
              placeholder="e.g. Label nodes with neon colors..." 
              className="w-full text-xs p-5 bg-slate-50 border border-slate-100 rounded-[1.8rem] focus:ring-8 focus:ring-blue-500/5 focus:border-blue-400 outline-none transition-all resize-none min-h-[100px] shadow-inner" 
            />
        </div>

        <div className="space-y-3 shrink-0">
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Style Templates</span>
          <div className="flex flex-wrap gap-2 max-h-[110px] overflow-y-auto no-scrollbar pb-1">
              {STYLE_CHIPS.map((chip, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setCustomPrompt(chip.prompt)} 
                  className={`text-[9px] font-black px-4 py-2 border rounded-full transition-all uppercase tracking-tight ${customPrompt === chip.prompt ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-blue-300 hover:text-blue-600'}`}
                >
                  {chip.label}
                </button>
              ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 shrink-0">
            <button 
              onClick={() => handleCapture(false)} 
              className="group relative flex flex-col items-center justify-center bg-slate-900 text-white py-5 rounded-[1.5rem] hover:bg-slate-800 transition-all shadow-xl active:scale-[0.98] overflow-hidden"
            >
              <span className="text-[11px] font-black uppercase tracking-widest z-10">Analyze</span>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest z-10 mt-0.5">Extraction</span>
              <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100"></div>
            </button>
            <button 
              onClick={() => handleCapture(true)} 
              className="group relative flex flex-col items-center justify-center bg-blue-600 text-white py-5 rounded-[1.5rem] hover:bg-blue-700 transition-all shadow-2xl shadow-blue-600/20 active:scale-[0.98] overflow-hidden"
            >
              <span className="text-[11px] font-black uppercase tracking-widest z-10">Remix</span>
              <span className="text-[8px] font-bold text-blue-200 uppercase tracking-widest z-10 mt-0.5">Synthesis</span>
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100"></div>
            </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-100 relative overflow-hidden">
      {documentData && (
        <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 z-30 shadow-sm">
            <div className="flex items-center space-x-1 sm:space-x-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-1 sm:p-1.5 hover:bg-white rounded-lg transition-all text-slate-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg></button>
              <span className="text-[9px] sm:text-[10px] font-black px-2 sm:px-3 text-slate-800 tabular-nums uppercase tracking-widest">{currentPage} / {numPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} className="p-1 sm:p-1.5 hover:bg-white rounded-lg transition-all text-slate-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg></button>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button onClick={onOpenMap} className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-slate-900 text-white rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10 active:scale-95">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
                  <span className="hidden xs:inline">Semantic Hub</span>
                  <span className="xs:hidden">Hub</span>
              </button>
              <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-1.5 sm:p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-white transition-all"><svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg></button>
                <span className="text-[8px] sm:text-[10px] font-black w-8 sm:w-12 text-center text-slate-500 tabular-nums">{Math.round(scale * 100)}%</span>
                <button onClick={() => setScale(s => Math.min(2.0, s + 0.1))} className="p-1.5 sm:p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-white transition-all"><svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg></button>
              </div>
            </div>
        </div>
      )}

      <div ref={containerRef} className="flex-1 overflow-auto p-4 flex justify-center bg-slate-100 no-scrollbar relative">
        {!documentData ? (
           <div className="flex flex-col items-center justify-center py-20 animate-in fade-in slide-in-from-bottom-6 duration-700 max-w-lg text-center m-auto px-4">
               <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center mb-6 sm:mb-10 shadow-2xl shadow-blue-500/10 border border-slate-100/50">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
               </div>
               <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4 sm:mb-6">DocLens v3</h2>
               <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-8 sm:mb-12 uppercase font-bold tracking-widest px-4 sm:px-8">
                 Multimodal Analysis Hub. Select page regions to engage the Intelligence engine.
               </p>
               
               <label className="group relative flex flex-col items-center justify-center w-64 sm:w-72 h-16 sm:h-18 bg-slate-900 rounded-[1.8rem] sm:rounded-[2rem] cursor-pointer hover:bg-slate-800 transition-all shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] active:scale-95 overflow-hidden">
                  <input type="file" accept="application/pdf" className="hidden" onChange={onUploadFile} />
                  <div className="flex items-center space-x-3 sm:space-x-4 text-white">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    <span className="text-[11px] sm:text-[12px] font-black uppercase tracking-[0.2em]">Deploy PDF</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
               </label>
           </div>
        ) : (
            <div className="relative cursor-crosshair inline-block self-start bg-white shadow-2xl border border-slate-200 rounded-[1.5rem] overflow-hidden">
                <canvas ref={canvasRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} />
                {selection && (selection.width > 0 || selection.height > 0) && (
                    <>
                      {/* Selection Box Overlay */}
                      <div 
                        className="absolute border-2 border-blue-500 bg-blue-500/10 ring-8 ring-blue-500/10 z-10 pointer-events-none" 
                        style={{ left: selection.x, top: selection.y, width: selection.width, height: selection.height }} 
                      >
                         {!isDrawing && !isMobile && (
                            <DeploymentTargetModal />
                         )}
                      </div>
                      
                      {/* Mobile Modal Backdrop */}
                      {!isDrawing && isMobile && (
                        <>
                          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[90] animate-in fade-in duration-300" onClick={() => setSelection(null)} />
                          <DeploymentTargetModal />
                        </>
                      )}
                    </>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;
