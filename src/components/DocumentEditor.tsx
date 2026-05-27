import { useState, useMemo } from 'react';
import { DocumentPage, LinkConnection, VisualEdge } from '../types';
import { computeTransitiveConnections } from '../utils/graphUtils';
import { Sparkles, Link as LinkIcon, Calendar, CheckCircle, Clock, Trash2, GitBranch, ArrowRight, CornerDownRight, BrainCircuit } from 'lucide-react';

interface DocumentEditorProps {
  page: DocumentPage;
  pages: DocumentPage[];
  links: LinkConnection[];
  onUpdatePage: (id: string, updates: Partial<DocumentPage>) => void;
  onAddLink: (fromId: string, toId: string) => void;
  onRemoveLink: (fromId: string, toId: string) => void;
}

export default function DocumentEditor({
  page,
  pages,
  links,
  onUpdatePage,
  onAddLink,
  onRemoveLink,
}: DocumentEditorProps) {
  // Local link creation state
  const [linkTargetId, setLinkTargetId] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isTagging, setIsTagging] = useState(false);

  // Compute direct and transitive connections
  const { directEdges, transitiveEdges } = useMemo(() => {
    return computeTransitiveConnections(pages, links);
  }, [pages, links]);

  // Direct outgoing links from this page
  const outgoingLinks = useMemo(() => {
    return directEdges.filter((e) => e.source === page.id);
  }, [directEdges, page.id]);

  // Backlinks (pages linking into this page)
  const incomingLinks = useMemo(() => {
    return directEdges.filter((e) => e.target === page.id);
  }, [directEdges, page.id]);

  // Transitive links reachable from this page
  const transitiveOutgoing = useMemo(() => {
    return transitiveEdges.filter((e) => e.source === page.id);
  }, [transitiveEdges, page.id]);

  // Parents list for link picker
  const linkCandidates = useMemo(() => {
    // Current outgoing connections
    const currentTargets = new Set(outgoingLinks.map((l) => l.target));
    return pages.filter((p) => p.id !== page.id && !currentTargets.has(p.id));
  }, [pages, outgoingLinks, page.id]);

  // Sync title & description if table row
  const parentDb = page.databaseId ? pages.find((p) => p.id === page.databaseId) : null;

  // Trigger server-side AI Summarize
  const handleAiSummarize = async () => {
    setIsSummarizing(true);
    try {
      const res = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: page.title, content: page.content }),
      });
      if (res.ok) {
        const data = await res.json();
        const appendText = `\n\n> **Aura AI Executive Summary:** ${data.summary}\n`;
        onUpdatePage(page.id, { content: page.content + appendText });
      }
    } catch (err) {
      console.error(err);
      alert('Could not generate AI summary.');
    } finally {
      setIsSummarizing(false);
    }
  };

  // Trigger server-side AI tag suggestion
  const handleAiTagProperties = async () => {
    setIsTagging(true);
    try {
      const res = await fetch('/api/gemini/generate-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: page.title, content: page.content }),
      });
      if (res.ok) {
        const data = await res.json();
        // Set properties Status & tags
        const currentProperties = { ...page.properties };
        if (data.status) {
          currentProperties['Status'] = data.status;
        }
        if (data.tags && data.tags.length > 0) {
          currentProperties['Dept'] = data.tags.join(', ');
        }
        onUpdatePage(page.id, { properties: currentProperties });
      }
    } catch (err) {
      console.error(err);
      alert('Could not suggest tags.');
    } finally {
      setIsTagging(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-white border border-[#E8E8E6] rounded-xl p-6 shadow-sm select-none">
      
      {/* 1. Header Row (Emoji + Title) */}
      <div className="flex items-start gap-4">
        <input
          type="text"
          value={page.icon || '📄'}
          onChange={(e) => onUpdatePage(page.id, { icon: e.target.value })}
          className="text-4xl bg-[#F7F7F5] border border-[#E8E8E6] hover:bg-[#F1F1EF] focus:border-[#37352F] rounded-xl h-16 w-16 text-center outline-none cursor-pointer transition-all"
          maxLength={2}
          title="Change emoji icon"
        />

        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={page.title}
            onChange={(e) => onUpdatePage(page.id, { title: e.target.value })}
            placeholder="Untitled Document..."
            className="text-2xl font-bold bg-transparent border-b border-transparent hover:border-[#E8E8E6] focus:border-[#37352F] text-[#37352F] outline-none w-full pb-1 transition-all"
          />

          {/* Database link indication */}
          {parentDb ? (
            <div className="mt-1 flex items-center gap-1.5 text-[10px] text-cyan-800 font-mono font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-600 animate-pulse" />
              <span>Row page inside Database: <strong>{parentDb.title}</strong></span>
            </div>
          ) : (
            <div className="mt-1 text-[10px] text-[#37352F]/40 font-mono">
              Created at: {new Date(page.createdAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {page.isDatabase && (
        <div className="p-4 bg-[#F7F7F5] border border-[#E8E8E6] rounded-lg text-xs leading-normal text-[#37352F]/70 shadow-2xs">
          ⚙️ <strong>Database Configured.</strong> Below this sheet you can configure rows and custom schemas. Type markdown document annotations inside this page if required.
        </div>
      )}

      {/* 2. Custom Properties (Only if row page) */}
      {parentDb && parentDb.propertyConfigs && (
        <div className="p-4 bg-[#F7F7F5]/80 border border-[#E8E8E6] rounded-lg grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="md:col-span-2 text-[10px] font-bold text-[#37352F]/40 tracking-widest border-b border-[#E8E8E6] pb-1 uppercase">Related Custom Properties</div>
          {parentDb.propertyConfigs.map((col) => {
            const val = page.properties[col.name];

            return (
              <div key={col.id} className="flex flex-col gap-1">
                <span className="text-[10px] text-[#37352F]/60 font-semibold uppercase">{col.name}</span>
                {col.type === 'select' ? (
                  <select
                    value={val || ''}
                    onChange={(e) => {
                      const updatedProps = { ...page.properties, [col.name]: e.target.value };
                      onUpdatePage(page.id, { properties: updatedProps });
                    }}
                    className="text-xs px-2.5 py-1.5 bg-white border border-[#E8E8E6] rounded text-[#37352F] focus:outline-none focus:border-[#37352F] cursor-pointer"
                  >
                    <option value="">—</option>
                    {col.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : col.type === 'checkbox' ? (
                  <label className="flex items-center gap-2 text-xs text-[#37352F]/80 cursor-pointer mt-1 font-medium">
                    <input
                      type="checkbox"
                      checked={!!val}
                      onChange={(e) => {
                        const updatedProps = { ...page.properties, [col.name]: e.target.checked };
                        onUpdatePage(page.id, { properties: updatedProps });
                      }}
                      className="bg-white border-[#E8E8E6] rounded text-[#37352F] focus:ring-0 focus:outline-none h-3.5 w-3.5"
                    />
                    <span>{col.name} Active</span>
                  </label>
                ) : col.type === 'date' ? (
                  <input
                    type="date"
                    value={val || ''}
                    onChange={(e) => {
                      const updatedProps = { ...page.properties, [col.name]: e.target.value };
                      onUpdatePage(page.id, { properties: updatedProps });
                    }}
                    className="text-xs px-2.5 py-1.5 bg-white border border-[#E8E8E6] rounded text-[#37352F] select-text"
                  />
                ) : (
                  <input
                    type="text"
                    value={val || ''}
                    onChange={(e) => {
                      const updatedProps = { ...page.properties, [col.name]: e.target.value };
                      onUpdatePage(page.id, { properties: updatedProps });
                    }}
                    className="text-xs px-2.5 py-1.5 bg-white border border-[#E8E8E6] rounded text-[#37352F] focus:outline-none focus:border-[#37352F]"
                    placeholder="Empty value..."
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Text Editor Area & AI Triggers */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-[#E8E8E6] pb-1.5">
          <span className="text-[10px] text-[#37352F]/40 font-bold uppercase tracking-widest">Markdown Document Body</span>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleAiTagProperties}
              disabled={isTagging}
              className="flex items-center gap-1 text-[10px] px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-800 rounded font-bold cursor-pointer transition-all disabled:opacity-40"
              title="Predict status and categorize with server-side AI model"
            >
              <BrainCircuit className="h-3 w-3" />
              <span>{isTagging ? 'Analyzing...' : 'AI Predict Properties'}</span>
            </button>

            <button
              onClick={handleAiSummarize}
              disabled={isSummarizing}
              className="flex items-center gap-1 text-[10px] px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 rounded font-bold cursor-pointer transition-all disabled:opacity-45"
            >
              <Sparkles className="h-3 w-3" />
              <span>{isSummarizing ? 'Summarizing...' : 'AI Executive Summary'}</span>
            </button>
          </div>
        </div>

        <textarea
          value={page.content}
          onChange={(e) => onUpdatePage(page.id, { content: e.target.value })}
          rows={11}
          placeholder="Start writing markdown details... support checklists, lists, tables."
          className="w-full text-xs px-3.5 py-3 bg-[#F9F9F8] border border-[#E8E8E6] hover:border-[#37352F]/40 focus:border-[#37352F] rounded-xl text-[#37352F] font-sans leading-relaxed outline-none transition-all resize-y select-text min-h-[150px]"
        />
      </div>

      {/* 4. Transitive Linking / Graph Relationships Panel */}
      <div className="border-t border-[#E8E8E6] pt-5 flex flex-col gap-4">
        <h4 className="text-xs font-bold text-[#37352F] tracking-wide flex items-center gap-1">
          <BrainCircuit className="h-4 w-4 text-emerald-600 animate-pulse" />
          KNOWLEDGE RELATIONSHIPS MATRIX
        </h4>

        {/* Dynamic add link row */}
        <div className="flex items-center gap-2">
          <select
            value={linkTargetId}
            onChange={(e) => setLinkTargetId(e.target.value)}
            className="flex-1 text-xs px-2.5 py-1.5 bg-[#F7F7F5] border border-[#E8E8E6] rounded-lg text-[#37352F] outline-none cursor-pointer hover:bg-[#F1F1EF] focus:border-[#37352F]"
          >
            <option value="">Select sibling page to map direct link...</option>
            {linkCandidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.title}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => {
              if (linkTargetId) {
                onAddLink(page.id, linkTargetId);
                setLinkTargetId('');
              }
            }}
            disabled={!linkTargetId}
            className="flex items-center gap-1 text-xs px-3.5 py-1.5 bg-[#37352F] hover:bg-[#4B4841] rounded-lg font-bold text-white transition-colors disabled:opacity-35 cursor-pointer shadow-xs"
          >
            <LinkIcon className="h-3.5 w-3.5" />
            <span>Link page</span>
          </button>
        </div>

        {/* Links display grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Direct Outgoing/Backlinks */}
          <div className="p-3.5 bg-[#F7F7F5] border border-[#E8E8E6] rounded-xl shadow-2xs">
            <span className="block text-[10px] text-emerald-700 font-bold mb-2 uppercase tracking-widest">Direct Links ({outgoingLinks.length + incomingLinks.length})</span>
            
            <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto scrollbar-thin">
              {/* Outgoing */}
              {outgoingLinks.map((edge) => {
                const targetTitle = pages.find((p) => p.id === edge.target)?.title || edge.target;
                const targetIcon = pages.find((p) => p.id === edge.target)?.icon || '📄';
                return (
                  <div key={edge.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-[#E8E8E6] text-[11px] text-[#37352F]">
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="text-[9px] px-1 bg-emerald-50 text-emerald-950 font-semibold rounded-sm">To</span>
                      <span>{targetIcon}</span>
                      <strong className="truncate max-w-[110px] text-slate-800">{targetTitle}</strong>
                    </span>
                    <button
                      onClick={() => onRemoveLink(page.id, edge.target)}
                      className="p-1 text-[#37352F]/40 hover:text-rose-600 rounded transition-colors cursor-pointer mr-1 hover:bg-[#F1F1EF]"
                      title="Delete connection"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}

              {/* Incoming backlinks */}
              {incomingLinks.map((edge) => {
                const srcTitle = pages.find((p) => p.id === edge.source)?.title || edge.source;
                const srcIcon = pages.find((p) => p.id === edge.source)?.icon || '📄';
                return (
                  <div key={edge.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-[#E8E8E6] text-[11px] text-[#37352F]">
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="text-[9px] px-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold rounded-sm">From</span>
                      <span>{srcIcon}</span>
                      <strong className="truncate max-w-[110px] text-slate-800">{srcTitle}</strong>
                    </span>
                    <button
                      onClick={() => onRemoveLink(edge.source, page.id)}
                      className="p-1 text-[#37352F]/40 hover:text-rose-600 rounded transition-colors cursor-pointer mr-1 hover:bg-[#F1F1EF]"
                      title="Delete connection"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}

              {outgoingLinks.length === 0 && incomingLinks.length === 0 && (
                <div className="text-[10px] text-[#37352F]/40 italic py-2">
                  No direct relation links configured here yet.
                </div>
              )}
            </div>
          </div>

          {/* Transitive automatic linking closure map */}
          <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-xl">
            <span className="block text-[10px] text-amber-800 font-bold mb-2 uppercase tracking-widest">Inferred Closures ({transitiveOutgoing.length})</span>
            
            <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto scrollbar-thin">
              {transitiveOutgoing.map((edge) => {
                const targetNode = pages.find((p) => p.id === edge.target);
                if (!targetNode) return null;

                return (
                  <div key={edge.id} className="p-2 bg-white rounded-lg border border-amber-200 text-[11px] text-[#37352F] flex flex-col gap-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-900 font-bold rounded-sm">Auto Linked</span>
                        <span>{targetNode.icon}</span>
                        <strong className="truncate text-slate-800">{targetNode.title}</strong>
                      </span>
                    </div>

                    {/* Step-by-Step relationship tree */}
                    <div className="flex flex-wrap items-center gap-1 text-[10px] text-amber-800/80 font-mono pt-1 border-t border-amber-100">
                      {edge.path.map((nodeId, idx) => {
                        const pathItem = pages.find((p) => p.id === nodeId);
                        return (
                          <span key={nodeId} className="flex items-center">
                            {idx > 0 && <ArrowRight className="h-2.5 w-2.5 text-amber-600 mx-0.5 animate-pulse" />}
                            <span className="bg-[#F7F7F5] border border-[#E8E8E6] text-[#37352F] px-1.5 py-0.5 rounded truncate max-w-[75px]">{pathItem ? pathItem.title : nodeId}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {transitiveOutgoing.length === 0 && (
                <div className="text-[10px] text-[#37352F]/50 italic py-4 leading-normal text-center">
                  Connect A to B and B to C to trigger instant transitive closures automatically!
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
