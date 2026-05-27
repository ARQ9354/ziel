import React, { useState, useEffect } from 'react';
import { DocumentPage, LinkConnection } from '../types';
import { Sparkles, MessageSquare, Link, ChevronRight, HelpCircle, AlertCircle, Loader2 } from 'lucide-react';

interface CopilotPanelProps {
  activePage: DocumentPage;
  pages: DocumentPage[];
  links: LinkConnection[];
  onAddLink: (fromId: string, toId: string) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Suggestion {
  targetPageId: string;
  targetTitle: string;
  reason: string;
}

export default function CopilotPanel({
  activePage,
  pages,
  links,
  onAddLink,
}: CopilotPanelProps) {
  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I'm Aura. I can help analyze your GraphNotion workspace, autocomplete page outlines, or automatically suggest transitive links to integrate your knowledge graph. What would you like to achieve today?`,
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Suggested links state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  // Fetch AI link recommendations from server-side proxy
  const fetchLinkSuggestions = async () => {
    setIsSuggestionsLoading(true);
    setSuggestionError(null);
    try {
      const otherPages = pages.filter((p) => p.id !== activePage.id);
      const res = await fetch('/api/gemini/suggest-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPage: {
            id: activePage.id,
            title: activePage.title,
            content: activePage.content,
          },
          otherPages: otherPages.map((p) => ({
            id: p.id,
            title: p.title,
            content: p.content,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error('Could not compute relational recommendations');
      }

      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (err: any) {
      console.error(err);
      setSuggestionError(err.message || 'Could not fetch suggested links.');
    } finally {
      setIsSuggestionsLoading(false);
    }
  };

  // Re-fetch semantic link suggestions when active page selection changes
  useEffect(() => {
    setSuggestions([]);
    setSuggestionError(null);
  }, [activePage.id]);

  // Send message to Copilot AI
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg: Message = { role: 'user', content: chatInput.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // Calculate connection metadata for contextual prompts
      const workspaceContext = {
        pagesCount: pages.length,
        linksCount: links.length,
        activePageTitle: activePage.title,
      };

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          workspaceContext,
        }),
      });

      if (!res.ok) {
        throw new Error('Connection failed');
      }

      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.text }]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Sorry, there was an issue querying Aura AI: ${err.message || 'Please check your backend GEMINI_API_KEY settings.'}`,
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 h-full">
      
      {/* 1. Suggested Connections Module */}
      <div className="bg-white border border-[#E8E8E6] rounded-xl p-4 shadow-sm select-none">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs text-[#37352F] font-bold uppercase tracking-wider">
            <Link className="h-4 w-4 text-emerald-600" />
            <span>AI Link Recommendations</span>
          </div>

          <button
            onClick={fetchLinkSuggestions}
            disabled={isSuggestionsLoading}
            className="text-[10px] px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded font-bold cursor-pointer transition-all disabled:opacity-45"
          >
            {isSuggestionsLoading ? 'Computing...' : 'Suggest Connections'}
          </button>
        </div>

        <p className="text-[10px] text-[#37352F]/40 mb-4 leading-normal">
          Aura analyzes matching keyword profiles and parent properties across documents to suggest linkages.
        </p>

        {isSuggestionsLoading && (
          <div className="py-6 flex flex-col items-center justify-center gap-2 text-xs text-[#37352F]/70">
            <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />
            <span>AI is mapping knowledge matrices...</span>
          </div>
        )}

        {suggestionError && (
          <div className="bg-rose-50 border border-rose-200 p-3 rounded text-[10px] text-rose-850 flex items-start gap-1.5 leading-snug font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{suggestionError}</span>
          </div>
        )}

        {suggestions.length > 0 && !isSuggestionsLoading && (
          <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto scrollbar-thin">
            {suggestions.map((s) => (
              <div
                key={s.targetPageId}
                className="p-3 bg-[#F7F7F5] border border-[#E8E8E6] rounded-lg flex flex-col gap-1.5 text-xs outline-none hover:border-[#37352F]/40 transition-all"
              >
                <div className="flex items-center justify-between border-b border-[#E8E8E6] pb-1">
                  <span className="font-bold text-[#37352F] truncate">{s.targetTitle}</span>
                  <button
                    onClick={() => {
                      onAddLink(activePage.id, s.targetPageId);
                      setSuggestions((prev) => prev.filter((item) => item.targetPageId !== s.targetPageId));
                    }}
                    className="text-[10px] px-2 py-0.5 bg-[#37352F] hover:bg-[#4B4841] rounded text-white font-bold cursor-pointer transition-colors"
                  >
                    Establish Link
                  </button>
                </div>
                <p className="text-[11px] leading-relaxed text-[#37352F]/70 italic">"{s.reason}"</p>
              </div>
            ))}
          </div>
        )}

        {suggestions.length === 0 && !isSuggestionsLoading && !suggestionError && (
          <div className="py-5 text-center text-[11px] text-[#37352F]/40 bg-[#F9F9F8] rounded border border-dashed border-[#E8E8E6]">
            Click "Suggest Connections" to scan your workspace.
          </div>
        )}
      </div>

      {/* 2. Chat Copilot Interface */}
      <div className="bg-white border border-[#E8E8E6] rounded-xl p-4 shadow-sm flex-1 flex flex-col min-h-[300px]">
        <div className="flex items-center gap-1.5 text-xs text-[#37352F] font-bold border-b border-[#E8E8E6] pb-2.5 mb-3 select-none uppercase tracking-wider">
          <MessageSquare className="h-4 w-4 text-indigo-600" />
          <span>AURA COPILOT ACTIVE SYSTEM</span>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 mb-3 pr-1 text-xs scrollbar-thin max-h-[380px]">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg leading-normal ${
                m.role === 'assistant'
                  ? 'bg-[#F7F7F5] border border-[#E8E8E6] text-[#37352F]'
                  : 'bg-[#37352F] text-white self-end max-w-[85%] font-medium'
              }`}
            >
              <div className={`text-[9px] uppercase font-bold mb-1 select-none ${m.role === 'assistant' ? 'text-[#37352F]/40' : 'text-white/40'}`}>
                {m.role === 'assistant' ? 'Aura Assist' : 'You'}
              </div>
              <p className={`whitespace-pre-line leading-relaxed ${m.role === 'assistant' ? 'text-[#37352F]/90' : 'text-white'}`}>{m.content}</p>
            </div>
          ))}

          {isChatLoading && (
            <div className="p-3 rounded-lg bg-[#F7F7F5] border border-[#E8E8E6] text-[#37352F]/50 italic flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
              <span>Aura is formulating response...</span>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSendMessage} className="flex gap-1.5 select-none">
          <input
            type="text"
            placeholder="Ask Copilot (e.g., summarize connections, outline spec...)"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={isChatLoading}
            className="flex-1 bg-white border border-[#E8E8E6] rounded-lg px-3 py-2 text-xs text-[#37352F] outline-none focus:border-[#37352F] disabled:opacity-50 placeholder-[#37352F]/30"
          />
          <button
            type="submit"
            disabled={isChatLoading || !chatInput.trim()}
            className="px-3.5 py-2 bg-[#37352F] hover:bg-[#4B4841] rounded-lg text-white font-bold text-xs cursor-pointer select-none transition-all disabled:opacity-40 shadow-2xs"
          >
            Send
          </button>
        </form>
      </div>

    </div>
  );
}
