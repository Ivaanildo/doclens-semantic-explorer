
import React, { useState, useEffect } from 'react';
import MarkmapRenderer from './MarkmapRenderer';
import { GraphInteraction, DetailedNodeInfo, Message } from '../types';
import { fetchNodeDetails, streamChatResponse } from '../services/geminiService';
import MarkdownRenderer from './MarkdownRenderer';

interface SemanticMapModalProps {
  markdown?: string;
  isLoading?: boolean;
  onClose: () => void;
  onDeepDive: (concept: string) => void;
}

const SemanticMapModal: React.FC<SemanticMapModalProps> = ({ markdown, isLoading, onClose, onDeepDive }) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [nodeDetails, setNodeDetails] = useState<DetailedNodeInfo | null>(null);
  const [nodeChatMessages, setNodeChatMessages] = useState<Message[]>([]);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleNodeClick = async (interaction: GraphInteraction) => {
    setSelectedNode(interaction.label);
    setIsDrawerExpanded(true);
    setIsFetchingDetails(true);
    setNodeDetails(null);
    
    const loadingMessage: Message = {
      id: crypto.randomUUID(),
      role: 'model',
      content: `Analyzing conceptual framework for **${interaction.label}**...`,
      timestamp: Date.now()
    };
    setNodeChatMessages([loadingMessage]);

    try {
      // Step 1: Fetch structured conceptual data
      const details = await fetchNodeDetails(interaction.label, markdown || "");
      setNodeDetails(details);
      
      // Step 2: Stream deep pedagogical context
      let fullResponse = "";
      await streamChatResponse(
        [],
        `Explain the concept of "${interaction.label}" within this document's specific hierarchy. Highlight its importance and technical nuances.`,
        undefined,
        undefined,
        { selectedConcept: interaction.label, contextType: 'liberal', nodeHierarchy: interaction.path?.join(' > ') || '' },
        (chunk) => {
          fullResponse += chunk;
          setNodeChatMessages([
            { ...loadingMessage, content: fullResponse }
          ]);
        }
      );
    } catch (e) {
      console.error("Node analysis failed:", e);
      setNodeChatMessages([{ id: 'err', role: 'model', content: "Failed to load node intelligence.", isError: true, timestamp: Date.now() }]);
    } finally {
      setIsFetchingDetails(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white/60 backdrop-blur-3xl flex flex-col animate-in fade-in duration-500">
      {/* Dynamic Header */}
      <div className="h-20 border-b border-slate-200/50 flex items-center justify-between px-6 sm:px-10 bg-white/40 sticky top-0 z-50">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/10">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="hidden xs:block">
            <h2 className="text-slate-900 font-black text-lg tracking-tight uppercase tracking-widest leading-none">Semantic Hub</h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1.5">Knowledge Mapping Protocol</p>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
           <div className="relative group w-40 sm:w-80">
                <input 
                  type="text" 
                  placeholder="Filter nodes..." 
                  className="w-full text-[10px] font-black p-3.5 pl-10 sm:pl-12 bg-white/80 border border-slate-200 rounded-[1.2rem] outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all uppercase tracking-[0.1em]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-all active:scale-95 group">
                <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden bg-slate-50/50">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-slate-900/10 border-t-slate-900 rounded-full animate-spin mb-6"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Projecting Lab Data...</span>
          </div>
        ) : markdown ? (
          <MarkmapRenderer markdown={markdown} onNodeClick={handleNodeClick} searchHighlight={searchQuery} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
             <span className="text-slate-300 font-black uppercase tracking-widest text-sm opacity-50">Mapping Offline</span>
          </div>
        )}

        {!selectedNode && !isLoading && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur shadow-2xl px-8 py-4 rounded-3xl border border-slate-100 animate-bounce">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select a node to inspect grounding</span>
            </div>
        )}
      </div>

      {/* Node Analysis Drawer */}
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-white shadow-[0_-40px_100px_rgba(0,0,0,0.15)] rounded-t-[3rem] border-t border-slate-100 transition-all duration-700 ease-in-out z-[110] ${
            isDrawerExpanded ? 'h-[60vh]' : 'h-0'
        }`}
      >
        <div className="h-full flex flex-col relative overflow-hidden">
            <div className="h-14 flex items-center justify-center cursor-pointer group shrink-0" onClick={() => setIsDrawerExpanded(!isDrawerExpanded)}>
                <div className="w-20 h-1.5 bg-slate-100 group-hover:bg-slate-300 rounded-full transition-colors"></div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row p-6 sm:p-12 pt-0 gap-8 md:gap-16">
                {/* Node Metadata Section */}
                <div className="w-full md:w-80 shrink-0 space-y-8 overflow-y-auto no-scrollbar pb-6 animate-in slide-in-from-left-4 duration-700">
                    <div className="space-y-4">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-4 py-1.5 rounded-full inline-block">Grounding Profile</span>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{selectedNode}</h3>
                        {nodeDetails && (
                            <p className="text-xs font-bold text-slate-500 leading-relaxed italic border-l-4 border-blue-500/20 pl-4 bg-slate-50/50 py-3 rounded-r-xl">
                                {nodeDetails.definition}
                            </p>
                        )}
                    </div>

                    {isFetchingDetails && !nodeDetails ? (
                        <div className="space-y-6 animate-pulse">
                            <div className="h-20 bg-slate-50 rounded-2xl w-full"></div>
                            <div className="h-32 bg-slate-50 rounded-2xl w-full"></div>
                        </div>
                    ) : nodeDetails && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-5 rounded-[1.8rem] border border-slate-100 text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Confidence</p>
                                    <p className="text-2xl font-black text-slate-800 tracking-tighter">{(nodeDetails.confidence * 100).toFixed(0)}%</p>
                                </div>
                                <div className="bg-slate-50 p-5 rounded-[1.8rem] border border-slate-100 text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Citations</p>
                                    <p className="text-2xl font-black text-slate-800 tracking-tighter">{nodeDetails.evidence?.length || 0}</p>
                                </div>
                            </div>

                            {nodeDetails.evidence && nodeDetails.evidence.length > 0 && (
                                <div className="space-y-3">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Evidence Snippets</span>
                                    <div className="space-y-2">
                                        {nodeDetails.evidence.slice(0, 3).map((ev, i) => (
                                            <div key={i} className="text-[10px] p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-black text-blue-600 uppercase tracking-widest opacity-60">Page {ev.page}</span>
                                                    <span className="text-[8px] font-bold text-slate-400">Match: {(ev.confidence * 100).toFixed(0)}%</span>
                                                </div>
                                                <p className="text-slate-500 line-clamp-2 italic">"{ev.snippet}"</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button 
                                onClick={() => onDeepDive(selectedNode!)}
                                className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all active:scale-[0.98] mt-4"
                            >
                                Project into Lab Chat
                            </button>
                        </div>
                    )}
                </div>

                {/* Conceptual AI Analysis Section */}
                <div className="flex-1 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 p-6 sm:p-12 overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-4 duration-700 mb-6">
                    <div className="max-w-3xl mx-auto">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Synthesis Engine</span>
                        </div>
                        <div className="space-y-8">
                            {nodeChatMessages.map((msg) => (
                                <div key={msg.id} className="animate-in fade-in duration-500">
                                    <MarkdownRenderer content={msg.content} />
                                </div>
                            ))}
                            {isFetchingDetails && (
                                <div className="flex gap-2 py-4">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            <button 
                onClick={() => setIsDrawerExpanded(false)}
                className="absolute top-6 right-8 sm:right-12 text-slate-300 hover:text-slate-500 p-2 transition-all"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
        </div>
      </div>
    </div>
  );
};

export default SemanticMapModal;
