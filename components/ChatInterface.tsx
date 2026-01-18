
import React, { useRef, useEffect, useState } from 'react';
import { Message, Command } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import MarkmapRenderer from './MarkmapRenderer';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onRegenerate: () => void;
  title?: string;
}

const COMMAND_LIBRARY: Command[] = [
    { id: 'summary', label: 'Synthesize Summary', prompt: 'Provide a structured summary of the key findings of this document.', icon: '📝' },
    { id: 'method', label: 'Explain Methodology', prompt: 'What is the methodology used in this document? Break it down into steps.', icon: '🔬' },
    { id: 'critique', label: 'Identify Limitations', prompt: 'What are the main limitations or constraints mentioned in the document?', icon: '⚠️' },
    { id: 'future', label: 'Next Steps', prompt: 'What are the future work or recommendations suggested by the authors?', icon: '🚀' }
];

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading, onRegenerate }) => {
  const [input, setInput] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent, customText?: string) => {
    e?.preventDefault();
    const textToSend = customText || input;
    if (!textToSend.trim() || isLoading) return;
    onSendMessage(textToSend);
    setInput('');
    setShowCommands(false);
  };

  const renderMessageContent = (msg: Message) => {
      const graphRegex = /\[GRAPH_START\]([\s\S]*?)\[GRAPH_END\]/;
      const match = graphRegex.exec(msg.content);
      let textContent = msg.content;
      let graphMarkdown = "";
      if (match) {
          textContent = msg.content.replace(match[0], "").trim();
          graphMarkdown = match[1].trim();
      }

      return (
          <div className="space-y-4">
            {msg.attachments?.map((att, idx) => (
                <div key={idx} className="mb-4 overflow-hidden rounded-2xl border border-slate-100 shadow-sm bg-slate-50/50 p-1.5 group">
                    <img src={att.data} alt="Context" className="max-h-64 rounded-xl object-contain w-full" />
                </div>
            ))}
            
            <div className={`text-sm leading-relaxed ${msg.role === 'user' ? 'text-slate-700 font-medium' : 'text-slate-800'}`}>
                <MarkdownRenderer content={textContent} />
            </div>

            {msg.metadata?.citations && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Grounding Citations</span>
                    <div className="flex flex-wrap gap-2">
                        {msg.metadata.citations.map((cite, i) => (
                            <div key={i} className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-lg border border-blue-100 flex items-center gap-1">
                                <span className="opacity-50">PG {cite.page}</span>
                                <span className="truncate max-w-[100px] italic">"{cite.snippet}"</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {graphMarkdown && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                    <div className="bg-slate-50/50 border border-slate-100 rounded-2xl overflow-hidden shadow-inner h-64">
                        <MarkmapRenderer markdown={graphMarkdown} />
                    </div>
                </div>
            )}
          </div>
      );
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 pt-6 pb-8 space-y-8 no-scrollbar">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex flex-col max-w-[95%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`px-5 py-4 rounded-3xl text-sm border ${msg.role === 'user' ? 'bg-slate-50 border-slate-200/50 rounded-tr-none' : 'bg-white border-slate-100 shadow-sm rounded-tl-none'}`}>
                            {renderMessageContent(msg)}
                        </div>
                    </div>
                </div>
            ))}
            {isLoading && <div className="flex justify-start"><div className="bg-white border border-slate-100 px-5 py-4 rounded-3xl animate-pulse text-blue-600 font-black text-[10px] uppercase tracking-widest">Synthesizing...</div></div>}
            <div ref={messagesEndRef} />
        </div>

        {/* Input & Commands */}
        <div className="p-6 bg-white border-t border-slate-100 relative">
            {showCommands && (
                <div className="absolute bottom-full left-6 right-6 mb-4 bg-white border border-slate-100 rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300 z-50">
                    <div className="p-4 bg-slate-50 border-b border-slate-100"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Command Library</span></div>
                    <div className="p-2 grid grid-cols-1 gap-1">
                        {COMMAND_LIBRARY.map(cmd => (
                            <button key={cmd.id} onClick={() => handleSubmit(undefined, cmd.prompt)} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-all text-left">
                                <span className="text-xl">{cmd.icon}</span>
                                <div><p className="text-[11px] font-black text-slate-900 leading-none">{cmd.label}</p><p className="text-[9px] text-slate-400 mt-1 truncate max-w-[200px]">{cmd.prompt}</p></div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex gap-2">
                <button onClick={() => setShowCommands(!showCommands)} className={`p-4 rounded-2xl border transition-all ${showCommands ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                </button>
                <div className="relative flex-1 group">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmit())}
                        placeholder="Ask intelligence lab..."
                        rows={1}
                        className="w-full resize-none pl-5 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-400 text-sm font-medium"
                    />
                    <button onClick={() => handleSubmit()} disabled={!input.trim() || isLoading} className="absolute right-3 bottom-3 p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:bg-slate-200 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ChatInterface;
