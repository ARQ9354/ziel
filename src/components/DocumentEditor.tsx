import React, { useState, useMemo, useRef } from 'react';
import { DocumentPage, LinkConnection, PageComment } from '../types';
import { computeTransitiveConnections } from '../utils/graphUtils';
import { 
  Sparkles, 
  Link as LinkIcon, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Trash2, 
  GitBranch, 
  ArrowRight, 
  BrainCircuit, 
  ImageIcon, 
  MessageSquare, 
  Send,
  Plus,
  Smile,
  ChevronDown,
  Layout,
  FileText,
  MousePointerClick,
  AlignLeft,
  Search,
  BookOpen
} from 'lucide-react';

interface DocumentEditorProps {
  page: DocumentPage;
  pages: DocumentPage[];
  links: LinkConnection[];
  onUpdatePage: (id: string, updates: Partial<DocumentPage>) => void;
  onAddLink: (fromId: string, toId: string) => void;
  onRemoveLink: (fromId: string, toId: string) => void;
}

const COVER_PRESETS = [
  { name: 'Vintage William Morris Floral', url: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Deep Cosmic Starfield', url: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Pastel Aura Gradient', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Wabi-Sabi Plaster Art', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Sunlit Japanese Waves', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Abstract Liquid Dream', url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80' }
];

export default function DocumentEditor({
  page,
  pages,
  links,
  onUpdatePage,
  onAddLink,
  onRemoveLink,
}: DocumentEditorProps) {
  const [linkTargetId, setLinkTargetId] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isTagging, setIsTagging] = useState(false);
  
  // Comments UI State
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [commenterName, setCommenterName] = useState('Bruce Banner');

  // ---------- TABLE OF CONTENTS GENERATOR STATE & CALCULATOR ----------
  const [showToc, setShowToc] = useState(true);
  const [tocSearch, setTocSearch] = useState('');

  // Automatically scan page content for #, ##, and ### headings
  const headings = useMemo(() => {
    if (!page.content) return [];
    const lines = page.content.split('\n');
    const scanned: { id: string; text: string; level: 1 | 2 | 3; lineIndex: number }[] = [];
    
    lines.forEach((line, index) => {
      // Matches lines starting with #, ##, or ###
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length as 1 | 2 | 3;
        const text = match[2].trim().replace(/[\*_~`\[\]]/g, '');
        scanned.push({
          id: `heading-${index}-${level}-${text.substring(0, 10)}`,
          text,
          level,
          lineIndex: index,
        });
      }
    });
    return scanned;
  }, [page.content]);

  // Document metrics: Word count and estimated reading time
  const { wordCount, readingTime } = useMemo(() => {
    if (!page.content) return { wordCount: 0, readingTime: 0 };
    const cleanText = page.content.replace(/[#\*_~`>\-\[\]()]/g, ' ');
    const words = cleanText.trim().split(/\s+/).filter(Boolean);
    const count = words.length;
    const time = Math.max(1, Math.ceil(count / 200));
    return { wordCount: count, readingTime: time };
  }, [page.content]);

  // Click handler to select and scroll to the heading line inside the textarea
  const handleHeadingClick = (lineIndex: number) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const lines = page.content.split('\n');
    
    let charIndex = 0;
    for (let i = 0; i < lineIndex; i++) {
      charIndex += lines[i].length + 1; // Count characters plus newline
    }
    
    textarea.focus();
    // Highlight the entire line
    textarea.setSelectionRange(charIndex, charIndex + lines[lineIndex].length);
    
    // Estimate scroll coordinates using a line-height proxy
    const approxLineHeight = 22; // px per line
    textarea.scrollTop = Math.max(0, (lineIndex - 2) * approxLineHeight);
  };

  // Compute direct and transitive connections
  const { directEdges, transitiveEdges } = useMemo(() => {
    return computeTransitiveConnections(pages, links);
  }, [pages, links]);

  // Outgoing direct links
  const outgoingLinks = useMemo(() => {
    return directEdges.filter((e) => e.source === page.id);
  }, [directEdges, page.id]);

  // Backlinks
  const incomingLinks = useMemo(() => {
    return directEdges.filter((e) => e.target === page.id);
  }, [directEdges, page.id]);

  // Transitive outgoing
  const transitiveOutgoing = useMemo(() => {
    return transitiveEdges.filter((e) => e.source === page.id);
  }, [transitiveEdges, page.id]);

  const linkCandidates = useMemo(() => {
    const currentTargets = new Set(outgoingLinks.map((l) => l.target));
    return pages.filter((p) => p.id !== page.id && !currentTargets.has(p.id));
  }, [pages, outgoingLinks, page.id]);

  const parentDb = page.databaseId ? pages.find((p) => p.id === page.databaseId) : null;

  // AI Actions Mock Triggers
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

  // ---------- NOTION-STYLE SLASH COMMANDS MENU ----------
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashIndex, setSlashIndex] = useState(-1);
  const [selectedMenuIndex, setSelectedMenuIndex] = useState(0);

  const ALL_COMMANDS = useMemo(() => [
    {
      id: 'bullet-list',
      title: 'Bullet List',
      description: 'Insert a rapid bullet list item',
      icon: '•',
      text: '\n- ',
      keywords: ['bullet', 'list', 'dot', 'outline', '-']
    },
    {
      id: 'numbered-list',
      title: 'Numbered List',
      description: 'Insert a sequential ordered key item',
      icon: '1.',
      text: '\n1. ',
      keywords: ['numbered', 'list', 'sequence', '1', 'order']
    },
    {
      id: 'todo-list',
      title: 'To-Do Checked List',
      description: 'Add an interactive task checkbox row',
      icon: '☑️',
      text: '\n- [ ] ',
      keywords: ['todo', 'check', 'task', 'checklist', 'status']
    },
    {
      id: 'toggle-list',
      title: 'Toggle Accordion List',
      description: 'Add collapsible accordion details tag block',
      icon: '📁',
      text: '\n<details>\n<summary>📁 Toggle List (Click to expand)</summary>\n\nWrite nested details or targets here!\n</details>\n',
      keywords: ['toggle', 'accordion', 'collapse', 'details', 'hide']
    },
    {
      id: 'callout-box',
      title: 'Callout Highlighting Info',
      description: 'Visually distinct alert or tip highlight block',
      icon: '💡',
      text: '\n> 💡 **INFO CALLOUT:**\n> Type premium workflow guidelines or system warnings here!\n',
      keywords: ['callout', 'highlight', 'info', 'box', 'tip', 'alert']
    },
    {
      id: 'meeting-minutes',
      title: 'Meeting Minutes',
      description: 'Insert structured meeting details, agenda & attendees',
      icon: '📅',
      text: `\n# 📅 Meeting Minutes: [Topic]
**Date:** ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
**Time:** ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}

### 👥 Attendees
- [ ] Name 1 (Organizer)
- [ ] Name 2
- [ ] Name 3

### 🎯 Agenda & Objectives
1. Goal / Focus of today's review
2. Core discussion points
3. Actions and next steps

### 📝 Discussion & Notes
- Write discussion notes here...

### ✅ Action Items
- [ ] Task 1 — @Owner (Due: [Date])
- [ ] Task 2 — @Owner (Due: [Date])
\n`,
      keywords: ['meeting', 'minutes', 'agenda', 'attendees', 'date', 'template', 'notes', 'session']
    },
    {
      id: 'convert-database',
      title: 'Convert to Database',
      description: '⚡ Shift current page mode to a structured database',
      icon: '🗃️',
      text: () => {
        onUpdatePage(page.id, {
          isDatabase: true,
          propertyConfigs: [
            { id: 'status-col-1', name: 'Status', type: 'select', options: ['Backlog', 'Ready', 'In Progress', 'Completed ✅'] },
            { id: 'priority-col-2', name: 'Priority', type: 'select', options: ['Urgent 🚨', 'High', 'Medium', 'Low'] },
            { id: 'assignee-col-3', name: 'Assignee', type: 'text', options: [] }
          ]
        });
      },
      keywords: ['database', 'db', 'sheet', 'grid', 'table', 'convert']
    },
    {
      id: 'ai-summary',
      title: 'AI Summary Outline',
      description: '🤖 Invoke Aura AI Copilot model to summarize page details',
      icon: '🤖',
      text: () => {
        handleAiSummarize();
      },
      keywords: ['ai', 'summarize', 'copilot', 'aura', 'outline']
    },
    {
      id: 'divider-line',
      title: 'Divider Line',
      description: 'Insert a horizontal visual separator line',
      icon: '—',
      text: '\n\n---\n',
      keywords: ['divider', 'line', 'hr', 'separate']
    },
    {
      id: 'quote-block',
      title: 'Vintage Quote Block',
      description: 'Add an elegant italic formatted display quote block',
      icon: '💬',
      text: '\n> "The best way to predict the future is to invent it."\n',
      keywords: ['quote', 'block', 'cite', 'italic', 'vintage']
    },
    {
      id: 'heading-1',
      title: 'Heading 1',
      description: 'Main sections large displays heading',
      icon: 'H1',
      text: '\n# ',
      keywords: ['h1', 'heading', 'title', 'main']
    },
    {
      id: 'heading-2',
      title: 'Heading 2',
      description: 'Medium sub-heading category title',
      icon: 'H2',
      text: '\n## ',
      keywords: ['h2', 'heading', 'sub', 'minor']
    },
    {
      id: 'heading-3',
      title: 'Heading 3',
      description: 'Small nested sub-heading label',
      icon: 'H3',
      text: '\n### ',
      keywords: ['h3', 'heading', 'sub']
    }
  ], [page.id, onUpdatePage, handleAiSummarize]);

  const filteredCommands = useMemo(() => {
    if (!slashQuery) return ALL_COMMANDS;
    return ALL_COMMANDS.filter((cmd) =>
      cmd.title.toLowerCase().includes(slashQuery) ||
      cmd.description.toLowerCase().includes(slashQuery) ||
      cmd.keywords.some((k) => k.includes(slashQuery))
    );
  }, [slashQuery, ALL_COMMANDS]);

  const handleApplyCommand = (insertText: string | (() => void)) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const currentVal = textarea.value;
    const selStart = textarea.selectionStart;

    if (typeof insertText === 'function') {
      const newVal = currentVal.substring(0, slashIndex) + currentVal.substring(selStart);
      onUpdatePage(page.id, { content: newVal });
      setShowSlashMenu(false);
      insertText();
      return;
    }

    const newVal = currentVal.substring(0, slashIndex) + insertText + currentVal.substring(selStart);
    onUpdatePage(page.id, { content: newVal });
    setShowSlashMenu(false);

    setTimeout(() => {
      textarea.focus();
      const newPos = slashIndex + insertText.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 10);
  };

  // Comments Management
  const addPageComment = () => {
    if (!commentText.trim()) return;
    const newComment: PageComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      author: commenterName,
      text: commentText.trim(),
      createdAt: new Date().toISOString()
    };
    const currentComments = page.comments || [];
    onUpdatePage(page.id, { comments: [...currentComments, newComment] });
    setCommentText('');
  };

  const deletePageComment = (commentId: string) => {
    const currentComments = page.comments || [];
    const updated = currentComments.filter((c) => c.id !== commentId);
    onUpdatePage(page.id, { comments: updated });
  };

  // Instant Template Injections for Blank Pages
  const injectTemplate = (type: 'outline' | 'meeting' | 'database' | 'form') => {
    let content = '';
    switch (type) {
      case 'outline':
        content = `# 🚀 Project Roadmap Outline\n\n### Overview\nGive a concise summary of the engineering objectives, milestone completions, and target dates.\n\n### Key Deliverables\n- [ ] Design interactive workflow schema layout\n- [ ] Create transitive graph visualization nodes\n- [ ] Establish system boundary and telemetry metrics`;
        break;
      case 'meeting':
        content = `# 📅 AI Sync Meeting Notes Outline\n**Date:** May 27, 2026\n**Attendees:** Tony Stark, Bruce Banner, Sarah Connor\n\n## 🎯 Meeting Objectives\n1. Review transitive graph relationship propagation performance.\n2. Design dynamic database multi-level connectivity models.\n\n## 📝 Discussion\n- Spoke about the new full-window page layout option modeled after Notion.\n- Confirmed collapsible sidebars enhance distraction-free focus.\n\n## ⚡ Action Items\n- [ ] Complete William Morris-inspired cover preset mappings\n- [ ] Write interactive direct conversation comment threads`;
        break;
      case 'database':
        content = `# 📂 Product Sprint Database Sheet\n\nThis page guides database schema customizers. Configure custom select menus, priority indicators, and automated actions below this sheet. Type details of individual deliverables in the rows below.`;
        break;
      case 'form':
        content = `# 📝 Customer Survey Form Template\n\n### Submission Guidelines\nSubmit direct feedback to project maintainers. Review comments mapped below inside the page discussion.\n\n#### Feedback Questionnaire\n- **Score (1-10):** \n- **Key Strengths:** \n- **Improvement Areas:** `;
        break;
    }
    onUpdatePage(page.id, { content });
  };

  return (
    <div className="flex flex-col bg-white border border-[#E8E8E6] rounded-xl overflow-hidden shadow-xs relative">
      
      {/* ---------------- 1. Notion Cover Banner Layer ---------------- */}
      <div className="relative group w-full h-44 sm:h-52 bg-slate-100 overflow-hidden">
        {page.coverImage ? (
          <img 
            src={page.coverImage} 
            alt="Page cover" 
            className="w-full h-full object-cover select-none transition-transform duration-350"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-slate-100 to-zinc-200 flex items-center justify-center text-[#37352F]/20 font-mono text-[10px] uppercase tracking-widest font-bold">
            No cover image set
          </div>
        )}

        {/* Hover cover action buttons */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button
            onClick={() => setShowCoverPicker(!showCoverPicker)}
            className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 bg-white/90 hover:bg-white text-[#37352F] rounded shadow-sm border border-[#E8E8E6] cursor-pointer transition-all"
          >
            <ImageIcon className="h-3 w-3 text-purple-600" />
            <span>Change Cover</span>
          </button>
          
          {page.coverImage && (
            <button
              onClick={() => onUpdatePage(page.id, { coverImage: undefined })}
              className="flex items-center gap-1 text-[10px] font-bold px-2 py-1.5 bg-white/95 hover:bg-red-50 text-red-700 rounded shadow-sm border border-[#E8E8E6] cursor-pointer"
            >
              <span>Remove</span>
            </button>
          )}
        </div>

        {/* Floating Cover Selection Menu Bar Popup */}
        {showCoverPicker && (
          <div className="absolute top-12 right-3 w-72 bg-white rounded-xl shadow-lg border border-[#E8E8E6] p-3 z-30 select-none animate-[fadeIn_0.12s_ease-out]">
            <div className="flex items-center justify-between border-b border-[#E8E8E6] pb-1.5 mb-2">
              <span className="text-[10px] font-bold text-[#37352F]/50 uppercase tracking-widest">Select Cover Pattern</span>
              <button 
                onClick={() => setShowCoverPicker(false)}
                className="text-[10px] hover:text-black font-bold uppercase p-0.5 text-zinc-400"
              >
                Close
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-1.5">
              {COVER_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    onUpdatePage(page.id, { coverImage: preset.url });
                    setShowCoverPicker(false);
                  }}
                  className="group/item relative h-12 rounded overflow-hidden cursor-pointer border border-[#E8E8E6] hover:border-[#37352F] transition-all"
                >
                  <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/40 flex items-end p-1">
                    <span className="text-[8px] text-white font-medium truncate w-full block text-left">{preset.name}</span>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-2 border-t border-[#E8E8E6] pt-2">
              <input
                type="text"
                placeholder="Paste custom wallpaper image URL..."
                value={page.coverImage || ''}
                onChange={(e) => onUpdatePage(page.id, { coverImage: e.target.value })}
                className="w-full text-[10px] px-2 py-1.5 bg-[#F7F7F5] border border-[#E8E8E6] rounded focus:outline-none focus:border-[#37352F]"
              />
            </div>
          </div>
        )}
      </div>

      {/* ---------------- 2. Floating Title & Emoji Canvas Overlay ---------------- */}
      <div className="px-8 pb-8 flex flex-col pt-3">
        
        {/* Overlapping Page Emoji */}
        <div className="relative -mt-16 ml-1 mb-3 inline-block z-10 select-none">
          <input
            type="text"
            value={page.icon || '📄'}
            onChange={(e) => onUpdatePage(page.id, { icon: e.target.value })}
            className="text-4xl sm:text-5xl bg-white border-2 border-white hover:bg-[#F1F1EF] focus:border-purple-600 rounded-full h-20 w-20 text-center outline-none cursor-pointer transition-all shadow-md flex items-center justify-center font-bold"
            maxLength={2}
            title="Update document emoji"
          />
        </div>

        {/* Minimalist Action Controls on Top of Editor */}
        <div className="flex flex-wrap items-center gap-2 mb-4 text-[10px] font-bold text-[#37352F]/40 select-none border-b border-[#F1F1EF] pb-3">
          {!page.coverImage && (
            <button
              onClick={() => onUpdatePage(page.id, { coverImage: COVER_PRESETS[0].url })}
              className="flex items-center gap-1 hover:text-[#37352F] hover:bg-[#F1F1EF] px-1.5 py-0.5 rounded cursor-pointer transition-all"
            >
              <ImageIcon className="h-3 w-3" />
              <span>🌌 Add Cover</span>
            </button>
          )}

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1 hover:text-[#37352F] hover:bg-[#F1F1EF] px-1.5 py-0.5 rounded cursor-pointer transition-all"
          >
            <MessageSquare className="h-3 w-3" />
            <span>💬 Discussion ({page.comments?.length || 0})</span>
          </button>

          <button
            onClick={() => setShowToc(!showToc)}
            className={`flex items-center gap-1 hover:text-[#37352F] hover:bg-[#F1F1EF] px-1.5 py-0.5 rounded cursor-pointer transition-all ${
              showToc ? 'text-purple-700 bg-purple-50 hover:bg-purple-100' : 'text-[#37352F]/40'
            }`}
            title="Toggle interactive Table of Contents sidebar navigation list"
          >
            <AlignLeft className="h-3 w-3 text-purple-600" />
            <span>📋 Outline ({headings.length})</span>
          </button>
          
          <span className="ml-auto font-mono text-[9px] text-[#37352F]/30 uppercase font-medium">
            Modified {new Date(page.updatedAt || page.createdAt).toLocaleTimeString()}
          </span>
        </div>

        {/* Dynamic Title Input Area */}
        <div className="mb-4">
          <input
            type="text"
            value={page.title}
            onChange={(e) => onUpdatePage(page.id, { title: e.target.value })}
            placeholder="Untitled Page"
            className="text-3xl font-extrabold bg-transparent border-b border-transparent hover:border-[#E8E8E6]/60 focus:border-[#37352F] text-[#37352F] outline-none w-full pb-1.5 transition-all leading-tight select-text"
          />
          
          {parentDb ? (
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-cyan-800 font-mono font-bold uppercase tracking-wider bg-cyan-50 border border-cyan-150 rounded-md px-2.5 py-1 w-fit select-none">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-600 animate-pulse" />
              <span>Database Row in: <strong className="font-extrabold">{parentDb.title}</strong></span>
            </div>
          ) : (
            <div className="mt-1.5 text-[9px] text-[#37352F]/40 font-mono select-none uppercase tracking-wide">
              Created {new Date(page.createdAt).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* ---------------- 2.5 Table of Contents (TOC) Component ---------------- */}
        {showToc && (
          <div className="mb-6 bg-purple-50/25 border border-purple-100/90 rounded-xl p-4 select-none animate-[fadeIn_0.15s_ease-out]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100/60 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <AlignLeft className="h-4 w-4 text-purple-600 animate-pulse" />
                <span className="text-[11px] font-bold text-purple-950 uppercase tracking-widest">
                  Table of Contents Map
                </span>
                <span className="text-[10px] bg-purple-100 text-purple-800 font-mono font-bold px-1.5 py-0.5 rounded-full">
                  {headings.length}
                </span>
              </div>

              {/* Document health metrics */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-[9.5px] font-medium text-slate-500 bg-white border border-[#E8E8E6] rounded-md px-2.5 py-0.5 shadow-3xs">
                  <FileText className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{wordCount} words</span>
                </div>
                <div className="flex items-center gap-1 text-[9.5px] font-medium text-slate-500 bg-white border border-[#E8E8E6] rounded-md px-2.5 py-0.5 shadow-3xs">
                  <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                  <span>~ {readingTime} min read</span>
                </div>
              </div>
            </div>

            {/* Controls Row: Search filters & Quick Add Headings if empty */}
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-purple-400" />
                <input
                  type="text"
                  value={tocSearch}
                  onChange={(e) => setTocSearch(e.target.value)}
                  placeholder="Filter key headings search..."
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-purple-100 hover:border-purple-200 focus:border-purple-400 focus:ring-0 focus:outline-[#C084FC]/25 rounded-lg outline-none transition-all placeholder:text-purple-400/55 select-text text-purple-900 font-sans"
                />
              </div>

              {/* Quick Template Heading Injector tool */}
              <div className="flex items-center gap-1">
                <span className="text-[8.5px] text-purple-700/60 font-mono uppercase tracking-wide mr-1 hidden sm:inline">Add Section:</span>
                <button
                  onClick={() => {
                    const currentVal = page.content || '';
                    onUpdatePage(page.id, { content: currentVal + '\n\n# New Heading Section\nType details here...\n' });
                  }}
                  className="text-[9px] font-bold px-2 py-1 bg-white hover:bg-purple-50 border border-purple-100 text-purple-850 rounded hover:border-purple-300 transition-all cursor-pointer flex items-center gap-0.5"
                >
                  <Plus className="h-2.5 w-2.5" />
                  <span>H1</span>
                </button>
                <button
                  onClick={() => {
                    const currentVal = page.content || '';
                    onUpdatePage(page.id, { content: currentVal + '\n\n## Sub-category Section\nType details here...\n' });
                  }}
                  className="text-[9px] font-bold px-2 py-1 bg-white hover:bg-purple-50 border border-purple-100 text-purple-850 rounded hover:border-purple-300 transition-all cursor-pointer flex items-center gap-0.5"
                >
                  <Plus className="h-2.5 w-2.5" />
                  <span>H2</span>
                </button>
              </div>
            </div>

            {/* List of anchors */}
            <div className="max-h-[160px] overflow-y-auto pr-1 scrollbar-thin select-none">
              {(() => {
                const query = tocSearch.toLowerCase().trim();
                const filtered = headings.filter(h => h.text.toLowerCase().includes(query));

                if (headings.length === 0) {
                  return (
                    <div className="text-center py-4 bg-white/70 rounded-lg border border-dashed border-purple-200/55">
                      <p className="text-[10px] text-purple-600/80 font-bold">No headings found yet.</p>
                      <p className="text-[9.5px] text-purple-500/65 mt-0.5 font-medium">Type `# Heading` or use the quick buttons above to begin structuring your document!</p>
                    </div>
                  );
                }

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-3">
                      <p className="text-[10px] text-slate-400 font-medium">No headings match "{tocSearch}"</p>
                    </div>
                  );
                }

                return (
                  <div className="flex flex-col gap-1 pl-1">
                    {filtered.map((item) => {
                      const indents = {
                        1: 'pl-0 font-bold text-slate-800 text-xs py-1',
                        2: 'pl-4 text-slate-600 text-[11px] py-1',
                        3: 'pl-8 text-slate-500 text-[10px] py-0.5'
                      }[item.level];

                      const prefixColors = {
                        1: 'bg-purple-500',
                        2: 'bg-indigo-400',
                        3: 'bg-slate-300'
                      }[item.level];

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleHeadingClick(item.lineIndex)}
                          className={`group/toc flex items-center justify-between w-full hover:bg-white/90 px-2 py-0.5 rounded-lg border border-transparent hover:border-purple-100 transition-all cursor-pointer text-left ${indents}`}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <span className={`h-1.5 w-1.5 rounded-full ${prefixColors} shrink-0 group-hover/toc:scale-125 transition-transform`} />
                            <span className="truncate group-hover/toc:text-purple-700 font-sans">{item.text}</span>
                          </span>
                          <span className="text-[8px] font-mono font-semibold text-slate-400 group-hover/toc:text-purple-500 select-none pb-0.5 px-1 bg-slate-50 border border-[#E8E8E6] rounded invisible group-hover/toc:visible">
                            Go to L. {item.lineIndex + 1}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ---------------- 3. Interactive Discussion Comments Section ---------------- */}
        {showComments && (
          <div className="mb-6 p-4 bg-[#F9F9F8] border border-[#E8E8E6] rounded-xl flex flex-col gap-3 select-none">
            <div className="flex items-center justify-between border-b border-[#E8E8E6] pb-1.5">
              <span className="text-[10px] font-bold text-[#37352F]/50 uppercase tracking-widest flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-[#37352F]/60" />
                <span>Page Discussion Thread</span>
              </span>
              
              {/* Changer commenter persona for playfulness */}
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-[#37352F]/55 font-semibold">Post As:</span>
                <select
                  value={commenterName}
                  onChange={(e) => setCommenterName(e.target.value)}
                  className="text-[9px] bg-white border border-[#E8E8E6] rounded py-0.5 px-1 font-mono hover:bg-[#F1F1EF] focus:outline-none"
                >
                  <option value="You (Piyush)">You (Piyush)</option>
                  <option value="Tony Stark">Tony Stark</option>
                  <option value="Bruce Banner">Bruce Banner</option>
                  <option value="Sarah Connor">Sarah Connor</option>
                </select>
              </div>
            </div>

            {/* List of comments */}
            <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1 scrollbar-thin">
              {(page.comments || []).map((comm) => (
                <div key={comm.id} className="group flex flex-col bg-white p-2.5 rounded-lg border border-[#E8E8E6] text-xs relative select-text shadow-3xs hover:border-[#37352F]/30 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#37352F]/90 font-sans">{comm.author}</span>
                    <span className="text-[8px] text-[#37352F]/40 font-mono">
                      {new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[#37352F] leading-relaxed break-words">{comm.text}</p>
                  
                  {/* Delete hovering trigger */}
                  <button
                    onClick={() => deletePageComment(comm.id)}
                    className="absolute top-1 right-2 opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-red-650 cursor-pointer"
                    title="Delete Comment"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}

              {(page.comments || []).length === 0 && (
                <div className="text-[10px] text-[#37352F]/40 italic py-1 leading-normal text-center">
                  No collaborative thread comments added yet. Set your username and write of work objectives!
                </div>
              )}
            </div>

            {/* Writing new comment box */}
            <div className="flex items-center gap-1.5 mt-1">
              <input
                type="text"
                placeholder="Submit active task notes, discussion comments..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addPageComment();
                }}
                className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-[#E8E8E6] rounded focus:outline-none focus:border-[#37352F] select-text"
              />
              <button
                onClick={addPageComment}
                className="p-1.5 bg-[#37352F] hover:bg-black text-white rounded cursor-pointer transition-colors"
                title="Send comment"
              >
                <Send className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* ---------------- 4. Custom Database Row Fields ---------------- */}
        {parentDb && parentDb.propertyConfigs && (
          <div className="p-4 bg-[#F7F7F5]/80 border border-[#E8E8E6] rounded-xl mb-6 grid grid-cols-1 md:grid-cols-2 gap-3.5 shadow-3xs select-none">
            <div className="md:col-span-2 text-[10px] font-bold text-[#37352F]/40 tracking-widest border-b border-[#E8E8E6] pb-1 uppercase">
              Relational Key Properties
            </div>
            {parentDb.propertyConfigs.map((col) => {
              const val = page.properties[col.name];

              return (
                <div key={col.id} className="flex flex-col gap-1">
                  <span className="text-[10px] text-[#37352F]/60 font-bold uppercase tracking-wider">{col.name}</span>
                  {col.type === 'select' ? (
                    <select
                      value={val || ''}
                      onChange={(e) => {
                        const updatedProps = { ...page.properties, [col.name]: e.target.value };
                        onUpdatePage(page.id, { properties: updatedProps });
                      }}
                      className="text-xs px-2.5 py-1.5 bg-white border border-[#E8E8E6] rounded text-[#37352F] focus:outline-none focus:border-[#37352F] cursor-pointer"
                    >
                      <option value="">— Choose</option>
                      {col.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : col.type === 'checkbox' ? (
                    <label className="flex items-center gap-2 text-xs text-[#37352F]/80 cursor-pointer mt-1 font-medium select-none">
                      <input
                        type="checkbox"
                        checked={!!val}
                        onChange={(e) => {
                          const updatedProps = { ...page.properties, [col.name]: e.target.checked };
                          onUpdatePage(page.id, { properties: updatedProps });
                        }}
                        className="bg-white border-[#E8E8E6] rounded text-[#37352F] focus:ring-0 focus:outline-none h-3.5 w-3.5 cursor-pointer"
                      />
                      <span>Active checkbox</span>
                    </label>
                  ) : col.type === 'date' ? (
                    <input
                      type="date"
                      value={val || ''}
                      onChange={(e) => {
                        const updatedProps = { ...page.properties, [col.name]: e.target.value };
                        onUpdatePage(page.id, { properties: updatedProps });
                      }}
                      className="text-xs px-2.5 py-1.5 bg-white border border-[#E8E8E6] rounded text-[#37352F]"
                    />
                  ) : (
                    <input
                      type="text"
                      value={val || ''}
                      onChange={(e) => {
                        const updatedProps = { ...page.properties, [col.name]: e.target.value };
                        onUpdatePage(page.id, { properties: updatedProps });
                      }}
                      className="text-xs px-2.5 py-1.5 bg-white border border-[#E8E8E6] rounded text-[#37352F] focus:outline-none focus:border-[#37352F] select-text"
                      placeholder="Empty text..."
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ---------------- 5. Document Body Markdowns ---------------- */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[#E8E8E6] pb-2 select-none">
            <span className="text-[10px] text-[#37352F]/40 font-bold uppercase tracking-widest">
              Document Editor Canvas
            </span>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleAiTagProperties}
                disabled={isTagging}
                className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-800 rounded font-bold cursor-pointer transition-all disabled:opacity-40"
                title="Predict status and categorize with AI model"
              >
                <BrainCircuit className="h-3 w-3" />
                <span>{isTagging ? 'Predicting...' : 'AI Recommend Properties'}</span>
              </button>

              <button
                onClick={handleAiSummarize}
                disabled={isSummarizing}
                className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 rounded font-bold cursor-pointer transition-all disabled:opacity-45"
                title="Summarize document annotations"
              >
                <Sparkles className="h-3 w-3" />
                <span>{isSummarizing ? 'Analyzing...' : 'AI Outline Summary'}</span>
              </button>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            value={page.content}
            onChange={(e) => {
              const text = e.target.value;
              const selStart = e.target.selectionStart;
              
              onUpdatePage(page.id, { content: text });

              const textBeforeCursor = text.substring(0, selStart);
              const lastSlash = textBeforeCursor.lastIndexOf('/');
              
              if (lastSlash !== -1) {
                const afterSlash = textBeforeCursor.substring(lastSlash + 1);
                // Ensure no spaces or newlines have been typed after the slash
                if (!afterSlash.includes(' ') && !afterSlash.includes('\n')) {
                  setShowSlashMenu(true);
                  setSlashQuery(afterSlash.toLowerCase());
                  setSlashIndex(lastSlash);
                  setSelectedMenuIndex(0);
                  return;
                }
              }
              setShowSlashMenu(false);
            }}
            onKeyDown={(e) => {
              if (!showSlashMenu) return;

              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedMenuIndex((prev) => (prev + 1) % filteredCommands.length);
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedMenuIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
              } else if (e.key === 'Enter') {
                if (filteredCommands.length > 0) {
                  e.preventDefault();
                  handleApplyCommand(filteredCommands[selectedMenuIndex].text);
                }
              } else if (e.key === 'Escape') {
                e.preventDefault();
                setShowSlashMenu(false);
              }
            }}
            onBlur={() => {
              // Tiny timeout to let options mouseDown execute before popover closes
              setTimeout(() => {
                setShowSlashMenu(false);
              }, 180);
            }}
            rows={12}
            placeholder="Type details... Press '/' to convert to Database, insert bullet/numbered lists, callouts, or toggle lists!"
            className="w-full text-sm px-4 py-3.5 bg-[#FAF9F6]/50 border border-[#E8E8E6] hover:border-[#37352F]/35 focus:border-[#37352F] focus:bg-white rounded-xl text-[#37352F] font-sans leading-relaxed outline-none transition-all resize-y select-text min-h-[160px]"
          />

          {/* Floater Slash Command Menu (Notion-style) */}
          {showSlashMenu && filteredCommands.length > 0 && (
            <div className="absolute left-4 right-4 bg-white border border-purple-200/95 rounded-xl shadow-xl p-2 z-50 max-h-56 overflow-y-auto scrollbar-thin select-none animate-[fadeIn_0.1s_ease-out] top-[50px] min-w-[285px]">
              <div className="px-2.5 py-1 text-[9px] font-mono font-bold text-purple-700/60 uppercase tracking-widest border-b border-purple-50 mb-1 flex items-center justify-between">
                <span>⚡ Notion Slash Commands</span>
                <span>ESC to Close</span>
              </div>
              <div className="flex flex-col gap-0.5">
                {filteredCommands.map((cmd, idx) => (
                  <button
                    key={cmd.id}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevents blur event
                      handleApplyCommand(cmd.text);
                    }}
                    className={`flex items-center gap-3 w-full p-1.5 rounded-lg text-left transition-all cursor-pointer ${
                      idx === selectedMenuIndex
                        ? 'bg-purple-50 text-purple-950 border border-purple-100 shadow-2xs'
                        : 'border border-transparent hover:bg-[#F7F7F5] text-[#37352F]'
                    }`}
                  >
                    <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-purple-100 text-base font-bold select-none text-purple-850">
                      {cmd.icon}
                    </span>
                    <div className="truncate flex-1">
                      <strong className="block text-xs font-bold leading-normal">{cmd.title}</strong>
                      <span className="text-[10px] text-[#37352F]/50 font-medium block leading-none truncate">{cmd.description}</span>
                    </div>
                    {idx === selectedMenuIndex && (
                      <span className="text-[8.5px] px-1.5 py-0.5 bg-purple-100 text-purple-800 font-mono font-bold uppercase rounded shrink-0">
                        press enter
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ---------------- 5b. Get Started with (Quick Actions Buttons) ---------------- */}
        {(!page.content || page.content.trim().length < 60) && (
          <div className="mt-4 p-4 rounded-xl border border-dashed border-[#E8E8E6] bg-[#FAF9F6]/40 select-none">
            <span className="block text-[10px] text-[#37352F]/50 font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
              <MousePointerClick className="h-3.5 w-3.5 text-purple-600 animate-bounce" />
              <span>Get started with Notion Templates</span>
            </span>
            
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => injectTemplate('outline')}
                className="flex items-center gap-1 text-[10.5px] px-3 py-1.5 bg-white hover:bg-[#F1F1EF] border border-[#E8E8E6] text-[#37352F]/80 rounded hover:text-black transition-all font-semibold cursor-pointer"
              >
                <Sparkles className="h-3 w-3 text-purple-600" />
                <span>Ask AI Draft Outline</span>
              </button>

              <button
                onClick={() => injectTemplate('meeting')}
                className="flex items-center gap-1 text-[10.5px] px-3 py-1.5 bg-white hover:bg-[#F1F1EF] border border-[#E8E8E6] text-[#37352F]/80 rounded hover:text-black transition-all font-semibold cursor-pointer"
              >
                <FileText className="h-3 w-3 text-emerald-600" />
                <span>AI Meeting Notes</span>
              </button>

              <button
                onClick={() => injectTemplate('database')}
                className="flex items-center gap-1 text-[10.5px] px-3 py-1.5 bg-white hover:bg-[#F1F1EF] border border-[#E8E8E6] text-[#37352F]/80 rounded hover:text-black transition-all font-semibold cursor-pointer"
              >
                <Layout className="h-3 w-3 text-pink-600" />
                <span>Database Sprint Sheet</span>
              </button>

              <button
                onClick={() => injectTemplate('form')}
                className="flex items-center gap-1 text-[10.5px] px-3 py-1.5 bg-white hover:bg-[#F1F1EF] border border-[#E8E8E6] text-[#37352F]/80 rounded hover:text-black transition-all font-semibold cursor-pointer"
              >
                <CheckCircle className="h-3 w-3 text-cyan-600" />
                <span>Customer Survey Form</span>
              </button>
            </div>
          </div>
        )}

        {/* ---------------- 6. Relation Linking Transitive Connections Matrix ---------------- */}
        <div className="border-t border-[#E8E8E6]/60 mt-8 pt-6 flex flex-col gap-4 select-none">
          <h4 className="text-xs font-bold text-[#37352F] tracking-wide flex items-center gap-1.5">
            <BrainCircuit className="h-4 w-4 text-emerald-600 animate-pulse" />
            <span>KNOWLEDGE RELATIONSHIPS MATRIX</span>
          </h4>

          {/* Sibling relation list picker */}
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
              className="flex items-center gap-1 text-xs px-3.5 py-1.5 bg-[#37352F] hover:bg-[#4B4841] rounded-lg font-bold text-white transition-colors disabled:opacity-35 cursor-pointer shadow-3xs"
            >
              <LinkIcon className="h-3.5 w-3.5" />
              <span>Link page</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Direct outgoing or incoming connections */}
            <div className="p-3.5 bg-[#F7F7F5]/80 border border-[#E8E8E6] rounded-xl">
              <span className="block text-[9.5px] text-emerald-800 font-extrabold mb-2 uppercase tracking-widest">
                Direct Mappings ({outgoingLinks.length + incomingLinks.length})
              </span>
              
              <div className="flex flex-col gap-1.5 max-h-[150px] overflow-y-auto pr-1 scrollbar-thin">
                {outgoingLinks.map((edge) => {
                  const targetTitle = pages.find((p) => p.id === edge.target)?.title || edge.target;
                  const targetIcon = pages.find((p) => p.id === edge.target)?.icon || '📄';
                  return (
                    <div key={edge.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-[#E8E8E6] text-[11px] text-[#37352F] hover:border-[#37352F]/40 transition-all">
                      <span className="flex items-center gap-1.5 truncate">
                        <span className="text-[8.5px] px-1 bg-emerald-50 text-emerald-950 font-bold rounded">To</span>
                        <span>{targetIcon}</span>
                        <strong className="truncate max-w-[125px] text-slate-800">{targetTitle}</strong>
                      </span>
                      <button
                        onClick={() => onRemoveLink(page.id, edge.target)}
                        className="p-1 text-[#37352F]/40 hover:text-rose-600 rounded transition-colors cursor-pointer mr-0.5 hover:bg-[#F1F1EF]"
                        title="Delete connection"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}

                {incomingLinks.map((edge) => {
                  const srcTitle = pages.find((p) => p.id === edge.source)?.title || edge.source;
                  const srcIcon = pages.find((p) => p.id === edge.source)?.icon || '📄';
                  return (
                    <div key={edge.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-[#E8E8E6] text-[11px] text-[#37352F] hover:border-[#37352F]/40 transition-all">
                      <span className="flex items-center gap-1.5 truncate">
                        <span className="text-[8.5px] px-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold rounded">From</span>
                        <span>{srcIcon}</span>
                        <strong className="truncate max-w-[125px] text-slate-800">{srcTitle}</strong>
                      </span>
                      <button
                        onClick={() => onRemoveLink(edge.source, page.id)}
                        className="p-1 text-[#37352F]/40 hover:text-rose-600 rounded transition-colors cursor-pointer mr-0.5 hover:bg-[#F1F1EF]"
                        title="Delete connection"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}

                {outgoingLinks.length === 0 && incomingLinks.length === 0 && (
                  <div className="text-[10px] text-[#37352F]/40 italic py-2">
                    No relationships mapped. Select a sibling key above.
                  </div>
                )}
              </div>
            </div>

            {/* Transitive transitive connection layout */}
            <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-xl">
              <span className="block text-[9.5px] text-amber-900 font-extrabold mb-2 uppercase tracking-widest">
                Transitive Closures ({transitiveOutgoing.length})
              </span>
              
              <div className="flex flex-col gap-1.5 max-h-[150px] overflow-y-auto pr-1 scrollbar-thin">
                {transitiveOutgoing.map((edge) => {
                  const targetNode = pages.find((p) => p.id === edge.target);
                  if (!targetNode) return null;

                  return (
                    <div key={edge.id} className="p-2 bg-white rounded-lg border border-amber-200 text-[11px] text-[#37352F] flex flex-col gap-1 shadow-3xs hover:border-amber-300 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="text-[8px] px-1 bg-amber-100 text-amber-950 font-black rounded uppercase">Inferred</span>
                          <span>{targetNode.icon}</span>
                          <strong className="truncate text-slate-800">{targetNode.title}</strong>
                        </span>
                      </div>

                      {/* Path Representation */}
                      <div className="flex flex-wrap items-center gap-0.5 text-[8.5px] text-amber-800/80 font-mono pt-1.5 border-t border-amber-100">
                        {edge.path.map((nodeId, idx) => {
                          const pathItem = pages.find((p) => p.id === nodeId);
                          return (
                            <span key={nodeId} className="flex items-center">
                              {idx > 0 && <ArrowRight className="h-2 w-2 text-amber-600 mx-0.5 animate-pulse" />}
                              <span className="bg-[#F7F7F5] border border-[#E8E8E6] text-[#37352F] px-1 py-0.5 rounded truncate max-w-[65px]">
                                {pathItem ? pathItem.title : nodeId}
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {transitiveOutgoing.length === 0 && (
                  <div className="text-[10px] text-amber-800/50 italic py-3 leading-normal">
                    Connect A to B and B to C to automatically construct transitive relationships in the system closure map!
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
