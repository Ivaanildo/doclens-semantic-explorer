
import React, { useState, useEffect, useCallback } from 'react';
import DocumentViewer from './components/DocumentViewer';
import ChatInterface from './components/ChatInterface';
import SemanticMapModal from './components/SemanticMapModal';
import Resizer from './components/Resizer';
import { Conversation, Message, Rect, GraphGenerationConfig } from './types';
import { getConversations, saveConversation, createNewConversation, updateConversationTitle } from './services/storageService';
import { streamChatResponse, generateTitle, generateRemix, generateDocumentMindMap, compareConcepts } from './services/geminiService';

const App: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [currentDocument, setCurrentDocument] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Layout State
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [rightPanelWidth, setRightPanelWidth] = useState(450);
  const [isResizingRight, setIsResizingRight] = useState(false);
  
  // Modal State
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [mapMarkdown, setMapMarkdown] = useState<string | undefined>(undefined);
  const [isGeneratingMap, setIsGeneratingMap] = useState(false);

  useEffect(() => {
    const loaded = getConversations();
    setConversations(loaded);
    if (loaded.length > 0) {
      setCurrentConversationId(loaded[0].id);
    } else {
      handleNewConversation();
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingRight) {
          const newWidth = window.innerWidth - e.clientX;
          setRightPanelWidth(Math.min(Math.max(newWidth, 300), window.innerWidth * 0.7));
      }
    };
    const handleMouseUp = () => {
      setIsResizingRight(false);
      document.body.style.cursor = 'default';
    };
    if (isResizingRight) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingRight]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setCurrentDocument(result);
        setCurrentFileName(file.name);
        setMapMarkdown(undefined); 
        const newConv = createNewConversation(file.name);
        setConversations(prev => [newConv, ...prev]);
        setCurrentConversationId(newConv.id);
        saveConversation(newConv);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateMindMap = async (rootConcept?: string) => {
      if (!currentFileName) return;
      setIsGeneratingMap(true);
      setIsMapModalOpen(true);
      try {
          const map = await generateDocumentMindMap(currentFileName, rootConcept);
          setMapMarkdown(map);
      } catch (e) {
          console.error(e);
      } finally {
          setIsGeneratingMap(false);
      }
  };

  const processGeminiResponse = async (text: string, img?: string, pg?: number) => {
    setIsLoading(true);
    const respId = crypto.randomUUID();
    updateCurrentConversationMessages(msgs => [...msgs, { id: respId, role: 'model', content: '', timestamp: Date.now() }]);
    let full = "";
    try {
      const conv = conversations.find(c => c.id === currentConversationId);
      await streamChatResponse(conv?.messages || [], text, img, { title: currentFileName, page: pg }, undefined, (chunk) => {
        full += chunk;
        updateCurrentConversationMessages(msgs => msgs.map(m => m.id === respId ? { ...m, content: full } : m));
      });
      if ((conv?.messages.length || 0) <= 2) {
          generateTitle(text).then(t => {
              if (currentConversationId) {
                updateConversationTitle(currentConversationId, t);
                setConversations(prev => prev.map(c => c.id === currentConversationId ? { ...c, title: t } : c));
              }
          });
      }
    } catch (e) {
      updateCurrentConversationMessages(msgs => msgs.map(m => m.id === respId ? { ...m, content: "Error communicating with AI.", isError: true } : m));
    } finally { setIsLoading(false); }
  };

  const updateCurrentConversationMessages = useCallback((fn: (msgs: Message[]) => Message[]) => {
    setConversations(prev => {
        const index = prev.findIndex(c => c.id === currentConversationId);
        if (index === -1) return prev;
        const updatedMessages = fn(prev[index].messages);
        const updatedConv = { ...prev[index], messages: updatedMessages, updatedAt: Date.now() };
        saveConversation(updatedConv);
        const next = [...prev];
        next[index] = updatedConv;
        return next;
    });
  }, [currentConversationId]);

  const handleNewConversation = () => {
    const n = createNewConversation(currentFileName);
    setConversations(p => [n, ...p]); 
    setCurrentConversationId(n.id); 
    saveConversation(n);
  };

  const currentConv = conversations.find(c => c.id === currentConversationId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white font-sans text-slate-700">
      
      {/* Main Panel: PDF Viewer */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-slate-100 overflow-hidden border-r border-slate-200/50">
        <DocumentViewer 
          documentData={currentDocument} 
          onRegionSelected={(img, pg, rect, prompt, remix) => {
              if (remix) {
                  setIsLoading(true);
                  const userReqId = crypto.randomUUID();
                  const nUser = { id: userReqId, role: 'user', content: `Remix Request: ${prompt || "Generate visual alternative"}`, timestamp: Date.now(), attachments: [{ type: 'image', data: img }], metadata: { pageNumber: pg } } as Message;
                  updateCurrentConversationMessages(msgs => [...msgs, nUser]);

                  const respId = crypto.randomUUID();
                  updateCurrentConversationMessages(msgs => [...msgs, { id: respId, role: 'model', content: 'Remixing perspective...', timestamp: Date.now() }]);
                  
                  generateRemix(prompt || "Analyze and transform this visually", img, { title: currentFileName, page: pg }).then(res => {
                    updateCurrentConversationMessages(msgs => msgs.map(m => m.id === respId ? { 
                      ...m, 
                      content: res.text || "Here is the remixed visual interpretation:", 
                      attachments: res.image ? [{ type: 'image', data: res.image }] : [] 
                    } : m));
                  }).catch(e => {
                    updateCurrentConversationMessages(msgs => msgs.map(m => m.id === respId ? { ...m, content: "Failed to remix image.", isError: true } : m));
                  }).finally(() => setIsLoading(false));
              } else {
                  const n = { id: crypto.randomUUID(), role: 'user', content: prompt || "Analyze this region.", timestamp: Date.now(), attachments: [{ type: 'image', data: img }], metadata: { pageNumber: pg, regionCoordinates: rect } } as Message;
                  updateCurrentConversationMessages(msgs => [...msgs, n]);
                  processGeminiResponse(prompt || "Analyze this region.", img, pg);
              }
          }} 
          onTextExtracted={() => {}} 
          onUploadFile={handleFileUpload}
          onOpenMap={() => handleGenerateMindMap()}
        />
        
        {!showRightPanel && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-50">
            <button 
              onClick={() => setShowRightPanel(true)}
              className="group flex flex-col items-center justify-center w-12 h-44 bg-slate-900 text-white rounded-l-[2.5rem] shadow-2xl hover:w-16 transition-all duration-500 active:scale-95 border-l border-y border-white/10"
            >
              <svg className="w-5 h-5 mb-4 animate-pulse text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 19l-7-7 7-7" />
              </svg>
              <span className="[writing-mode:vertical-lr] rotate-180 text-[10px] font-black uppercase tracking-[0.3em] opacity-80 group-hover:opacity-100 transition-opacity">Chat Intelligence</span>
            </button>
          </div>
        )}
      </main>
      
      {showRightPanel && <Resizer onMouseDown={() => setIsResizingRight(true)} />}
      
      {/* Right Chat Panel (Always Chat) */}
      <aside 
        className={`bg-white transition-all duration-300 shrink-0 shadow-[-20px_0_60px_rgba(0,0,0,0.06)] h-full overflow-hidden flex flex-col z-30`} 
        style={{ width: showRightPanel ? rightPanelWidth : 0 }}
      >
        <div className="h-full flex flex-col relative w-full min-w-[300px]">
            <div className="border-b border-slate-100 bg-white/80 backdrop-blur-2xl sticky top-0 z-40 shrink-0">
                <div className="p-5 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${isLoading ? 'bg-blue-600 animate-pulse' : 'bg-slate-300'}`}></div>
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900">Intelligence Lab</span>
                    </div>
                    <button onClick={() => setShowRightPanel(false)} className="text-slate-300 hover:text-slate-900 transition-all p-2 group">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative h-full">
                <ChatInterface 
                  messages={currentConv?.messages || []} 
                  onSendMessage={(t) => {
                    if (!currentConversationId) return;
                    const n = { id: crypto.randomUUID(), role: 'user', content: t, timestamp: Date.now() } as Message;
                    updateCurrentConversationMessages(msgs => [...msgs, n]);
                    processGeminiResponse(t);
                  }} 
                  isLoading={isLoading} 
                  onRegenerate={() => {}} 
                />
            </div>
        </div>
      </aside>

      {/* Semantic Map Full Screen Modal */}
      {isMapModalOpen && (
        <SemanticMapModal 
          markdown={mapMarkdown} 
          isLoading={isGeneratingMap} 
          onClose={() => setIsMapModalOpen(false)}
          onDeepDive={(concept) => {
              setIsMapModalOpen(false);
              setShowRightPanel(true);
              const prompt = `Deep dive: Can you analyze the concept of "${concept}" specifically within the technical context of this document?`;
              const n = { id: crypto.randomUUID(), role: 'user', content: prompt, timestamp: Date.now() } as Message;
              updateCurrentConversationMessages(msgs => [...msgs, n]);
              processGeminiResponse(prompt);
          }}
        />
      )}
    </div>
  );
};

export default App;
