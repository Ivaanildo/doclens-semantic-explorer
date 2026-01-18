
import React, { useEffect, useRef, useState } from 'react';
import { GraphInteraction } from '../types';

interface MarkmapRendererProps {
  markdown: string;
  onNodeClick?: (interaction: GraphInteraction) => void;
  onNodeContextMenu?: (interaction: GraphInteraction) => void;
  searchHighlight?: string;
}

const MarkmapRenderer: React.FC<MarkmapRendererProps> = ({ markdown, onNodeClick, onNodeContextMenu, searchHighlight }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markmapInstanceRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLibLoaded, setIsLibLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      if (markmapInstanceRef.current) markmapInstanceRef.current.fit();
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!markmapInstanceRef.current || !searchHighlight) {
        if (svgRef.current) {
            const nodes = svgRef.current.querySelectorAll('.markmap-node');
            nodes.forEach((n: any) => n.style.opacity = '1');
        }
        return;
    }
    
    const term = searchHighlight.toLowerCase();
    const nodes = svgRef.current?.querySelectorAll('.markmap-node');
    nodes?.forEach((node: any) => {
        const text = node.textContent?.toLowerCase() || "";
        const match = text.includes(term);
        node.style.opacity = match ? '1' : '0.15';
        if (match) node.classList.add('highlight-pulse');
        else node.classList.remove('highlight-pulse');
    });
  }, [searchHighlight]);

  useEffect(() => {
    if (!svgRef.current || !markdown) return;
    let isMounted = true;

    const renderMap = async () => {
      try {
        const { Transformer } = await import('markmap-lib');
        const { Markmap } = await import('markmap-view');
        const d3Module = await import('d3');
        const d3 = d3Module.default || d3Module;

        if (!isMounted) return;
        setIsLibLoaded(true);

        const transformer = new Transformer();
        const { root } = transformer.transform(markdown);
        if (!root) return;

        if (markmapInstanceRef.current) {
          markmapInstanceRef.current.setData(root);
          // Wait for render cycle
          requestAnimationFrame(() => {
              if (markmapInstanceRef.current) markmapInstanceRef.current.fit();
          });
        } else {
          markmapInstanceRef.current = Markmap.create(svgRef.current, {
              autoFit: true,
              duration: 400,
              spacingHorizontal: 120,
              spacingVertical: 10,
              zoom: true,
              pan: true,
          }, root);
        }

        // Use a more reliable way to attach events after Markmap internal render
        const attachEvents = () => {
             const svg = d3.select(svgRef.current);
             const nodes = svg.selectAll('g.markmap-node');

             if (nodes.empty() && isMounted) {
                 setTimeout(attachEvents, 100);
                 return;
             }

             nodes.each(function(d: any) {
                 if (!d || typeof d.content !== 'string') return;
                 const label = d.content.replace(/<[^>]+>/g, '');
                 const id = d.state?.id || label;
                 
                 const getPath = (node: any): string[] => {
                     const path = [node.content.replace(/<[^>]+>/g, '')];
                     let p = node.parent;
                     while(p) {
                         path.unshift(p.content.replace(/<[^>]+>/g, ''));
                         p = p.parent;
                     }
                     return path;
                 };

                 const element = d3.select(this);
                 // Clear existing to avoid double listeners
                 element.on('click', null).on('dblclick', null);
                 
                 element
                    .style('cursor', 'pointer')
                    .on('click', (e: any) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (onNodeClick) {
                            onNodeClick({ type: 'click', nodeId: id, label: label, path: getPath(d) });
                        }
                    })
                    .on('dblclick', (e: any) => {
                         e.preventDefault();
                         e.stopPropagation();
                         if (onNodeClick) {
                             onNodeClick({ type: 'dblclick', nodeId: id, label: label, path: getPath(d) });
                         }
                    });
             });
        };

        // Initial attempt with short delay to allow Markmap to build the DOM
        setTimeout(attachEvents, 200);
        setError(null);
      } catch (e) {
        if (isMounted) setError("Graph Engine Failed.");
      }
    };

    renderMap();
    return () => { isMounted = false; };
  }, [markdown]);

  if (error) return <div className="text-red-400 text-[10px] p-8 font-black uppercase tracking-widest">{error}</div>;

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-50 flex-1 relative min-h-0 overflow-hidden">
       <style>{`
         .highlight-pulse { animation: highlight-glow 2s infinite; }
         @keyframes highlight-glow { 0% { filter: drop-shadow(0 0 2px rgba(37,99,235,0.2)); } 50% { filter: drop-shadow(0 0 12px rgba(37,99,235,0.6)); } 100% { filter: drop-shadow(0 0 2px rgba(37,99,235,0.2)); } }
         .markmap-node rect { fill: #ffffff !important; stroke: #e2e8f0 !important; rx: 12; ry: 12; transition: all 0.3s; }
         .markmap-node:hover rect { stroke: #2563eb !important; stroke-width: 2.5px; }
         .markmap-node text { font-family: sans-serif; font-size: 11px !important; font-weight: 700 !important; fill: #334155 !important; }
       `}</style>
       <svg ref={svgRef} className="w-full h-full block touch-none" />
       {!isLibLoaded && !error && (
           <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 z-10">
               <div className="flex flex-col items-center gap-4">
                   <div className="w-8 h-8 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Projecting Lab Data</span>
               </div>
           </div>
       )}
       <div className="absolute bottom-8 right-8 flex flex-col gap-4 z-20">
           <button 
               onClick={() => markmapInstanceRef.current?.fit()}
               className="bg-white p-4 rounded-2xl shadow-2xl text-slate-500 hover:text-blue-600 border border-slate-100 transition-all hover:scale-110 active:scale-95"
               title="Center Mapping"
           >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
           </button>
       </div>
    </div>
  );
};

export default MarkmapRenderer;
