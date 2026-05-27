import React, { useState } from 'react';
import { DocumentPage, LinkConnection } from '../types';
import { 
  Folder, 
  Database, 
  Plus, 
  Trash2, 
  Sparkles, 
  Globe, 
  Layout, 
  Layers, 
  CheckSquare, 
  Wrench,
  Link,
  GitBranch,
  Search,
  ChevronDown,
  ChevronRight,
  FileText
} from 'lucide-react';

interface SidebarProps {
  pages: DocumentPage[];
  activePageId: string;
  onSelectPage: (id: string) => void;
  onCreatePage: (isDatabase: boolean, isDatabaseRowId?: string | null) => void;
  onDeletePage: (id: string) => void;
  activeTab: 'editor' | 'automations' | 'graph';
  onChangeTab: (tab: 'editor' | 'automations' | 'graph') => void;
  links: LinkConnection[];
}

export default function Sidebar({
  pages,
  activePageId,
  onSelectPage,
  onCreatePage,
  onDeletePage,
  activeTab,
  onChangeTab,
  links,
}: SidebarProps) {
  const [search, setSearch] = useState('');
  const [collapsedParents, setCollapsedParents] = useState<Record<string, boolean>>({});

  // Match search query
  const matchesSearch = (title: string) => {
    return title.toLowerCase().includes(search.toLowerCase());
  };

  // Filter root documents: not databases, no parentId, or matching search if searching
  const parentDocuments = pages.filter(
    (p) => !p.isDatabase && p.parentId === null && !p.databaseId && (search ? matchesSearch(p.title) : true)
  );

  const databases = pages.filter((p) => p.isDatabase && (search ? matchesSearch(p.title) : true));

  // Extract nested sub-pages for documents
  const getSubPagesForParent = (parentId: string) => {
    return pages.filter((p) => p.parentId === parentId && p.id !== parentId && !p.isDatabase);
  };

  // Helper to count connections for a page
  const getConnectionCount = (id: string) => {
    return links.filter((l) => l.fromId === id || l.toId === id).length;
  };

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedParents(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="w-64 bg-[#F1F1EF] border-r border-[#E8E8E6] flex flex-col h-full shrink-0 select-none">
      
      {/* Branding Header */}
      <div className="p-4 border-b border-[#E8E8E6]">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-[#37352F] flex items-center justify-center font-bold text-white text-[12px] shadow-sm">
            Z
          </div>
          <div>
            <h1 className="text-xs font-bold text-[#37352F] tracking-wide flex items-center gap-1 uppercase">
              Ziel Workspace
            </h1>
            <p className="text-[9px] text-[#37352F]/40 font-mono font-bold tracking-tight">Personal Workspace</p>
          </div>
        </div>
      </div>

      {/* Quick Search */}
      <div className="px-3 pt-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#37352F]/40" />
          <input
            type="text"
            placeholder="Quick Find (or search)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-[#FAF9F6] border border-[#E8E8E6] rounded-md text-[#37352F] placeholder-[#37352F]/30 focus:outline-none focus:border-[#37352F] focus:bg-white transition-all shadow-3xs"
          />
        </div>
      </div>

      {/* Navigation Quick Tabs */}
      <div className="px-3 pt-3.5 flex flex-col gap-1">
        <div className="text-[10px] font-bold text-[#37352F]/40 uppercase px-2 mb-1 tracking-widest">
          Workspace
        </div>
        
        <button
          onClick={() => onChangeTab('editor')}
          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-all ${
            activeTab === 'editor'
              ? 'bg-white text-[#37352F] font-bold shadow-2xs border border-[#E8E8E6]'
              : 'text-[#37352F]/70 hover:bg-[#E8E8E6]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Layout className="h-3.5 w-3.5 text-[#37352F]/60" />
            <span>Document Canvas</span>
          </div>
        </button>

        <button
          onClick={() => onChangeTab('automations')}
          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-all ${
            activeTab === 'automations'
              ? 'bg-white text-[#37352F] font-bold shadow-2xs border border-[#E8E8E6]'
              : 'text-[#37352F]/70 hover:bg-[#E8E8E6]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Wrench className="h-3.5 w-3.5 text-[#37352F]/60" />
            <span>Automation Center</span>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 bg-[#E8E8E6] rounded font-mono text-[#37352F]/50">Rules</span>
        </button>
      </div>

      <div className="my-2 border-t border-[#E8E8E6]/70" />

      {/* Structured Pages Content */}
      <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-4">
        
        {/* Pages & Documents List */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5 text-[10px] font-bold text-[#37352F]/40 tracking-widest uppercase">
            <span>Documents</span>
            <button
              onClick={() => onCreatePage(false)}
              className="p-0.5 hover:bg-[#E8E8E6] text-[#37352F]/50 hover:text-[#37352F] rounded transition-colors cursor-pointer"
              title="Add a new blank document"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-0.5">
            {parentDocuments.map((doc) => {
              const active = doc.id === activePageId && activeTab === 'editor';
              const connCount = getConnectionCount(doc.id);
              const subPages = getSubPagesForParent(doc.id);
              const isCollapsed = collapsedParents[doc.id] ?? false;

              return (
                <div key={doc.id} className="flex flex-col">
                  {/* Parent Document Element */}
                  <div
                    className={`group flex items-center justify-between px-2 py-1.5 rounded-md text-xs cursor-pointer transition-all ${
                      active
                        ? 'bg-white text-[#37352F] font-bold shadow-2xs border border-[#E8E8E6]'
                        : 'text-[#37352F]/70 hover:bg-[#E8E8E6] hover:text-[#37352F]'
                    }`}
                    onClick={() => {
                      onChangeTab('editor');
                      onSelectPage(doc.id);
                    }}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      {subPages.length > 0 ? (
                        <button
                          onClick={(e) => toggleCollapse(doc.id, e)}
                          className="p-0.5 hover:bg-[#E8E8E6] rounded text-[#37352F]/40 hover:text-[#37352F] cursor-pointer"
                        >
                          {isCollapsed ? (
                            <ChevronRight className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </button>
                      ) : (
                        <span className="w-4" />
                      )}
                      
                      <span className="shrink-0">{doc.icon}</span>
                      <span className="truncate">{doc.title || 'Untitled page'}</span>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {connCount > 0 && (
                        <span
                          className="text-[9px] px-1 bg-[#E8E8E6] text-[#37352F]/60 rounded font-mono"
                          title="Relational links"
                        >
                          {connCount}
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete document "${doc.title}"?`)) onDeletePage(doc.id);
                        }}
                        className="p-1 text-[#37352F]/40 hover:text-red-600 rounded cursor-pointer hover:bg-[#E8E8E6]"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Nested Sub-pages List (Indented) */}
                  {subPages.length > 0 && !isCollapsed && (
                    <div className="pl-6 border-l border-[#E8E8E6]/60 ml-3.5 mt-0.5 flex flex-col gap-0.5">
                      {subPages.map((subDoc) => {
                        const subActive = subDoc.id === activePageId && activeTab === 'editor';
                        return (
                          <div
                            key={subDoc.id}
                            className={`group flex items-center justify-between px-2 py-1 rounded-md text-[11px] cursor-pointer transition-all ${
                              subActive
                                ? 'bg-white text-[#37352F] font-bold shadow-3xs border border-[#E8E8E6]'
                                : 'text-[#37352F]/60 hover:bg-[#E8E8E6] hover:text-[#37352F]'
                            }`}
                            onClick={() => {
                              onChangeTab('editor');
                              onSelectPage(subDoc.id);
                            }}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="shrink-0 text-xs">{subDoc.icon}</span>
                              <span className="truncate">{subDoc.title || 'Untitled subpage'}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete subdocument "${subDoc.title}"?`)) onDeletePage(subDoc.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-[#37352F]/40 hover:text-red-600 rounded cursor-pointer hover:bg-[#E8E8E6]"
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            
            {parentDocuments.length === 0 && (
              <div className="text-[10px] text-[#37352F]/40 px-2 py-1 italic">
                No active document pages.
              </div>
            )}
          </div>
        </div>

        {/* Databases Section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5 text-[10px] font-bold text-[#37352F]/40 tracking-widest uppercase">
            <span>Databases</span>
            <button
              onClick={() => onCreatePage(true)}
              className="p-0.5 hover:bg-[#E8E8E6] text-[#37352F]/50 hover:text-[#37352F] rounded transition-colors cursor-pointer"
              title="Create a new Database table"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-0.5">
            {databases.map((db) => {
              const active = db.id === activePageId && activeTab === 'editor';
              const connCount = getConnectionCount(db.id);

              return (
                <div
                  key={db.id}
                  className={`group flex items-center justify-between px-2 py-1.5 rounded-md text-xs cursor-pointer transition-all ${
                    active
                      ? 'bg-white text-[#37352F] font-bold shadow-2xs border border-[#E8E8E6]'
                      : 'text-[#37352F]/70 hover:bg-[#E8E8E6] hover:text-[#37352F]'
                  }`}
                  onClick={() => {
                    onChangeTab('editor');
                    onSelectPage(db.id);
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0">{db.icon}</span>
                    <span className="truncate font-semibold text-[#37352F]">{db.title || 'Untitled Database'}</span>
                  </div>

                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {connCount > 0 && (
                      <span className="text-[9px] px-1 bg-[#E8E8E6] text-[#37352F]/70 rounded font-mono font-bold">
                        {connCount}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to delete this database and all its rows?`)) {
                          onDeletePage(db.id);
                        }
                      }}
                      className="p-1 text-[#37352F]/40 hover:text-red-350 rounded cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}

            {databases.length === 0 && (
              <div className="text-[10px] text-[#37352F]/40 px-2 py-1 italic">
                No active databases available.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Bottom Control Info Panel */}
      <div className="p-3 bg-[#F1F1EF] border-t border-[#E8E8E6] text-center shrink-0">
        <div className="bg-white p-2.5 rounded-lg border border-[#E8E8E6] text-[10px] text-[#37352F]/70 flex flex-col gap-1 text-left select-text shadow-xs">
          <div className="flex items-center gap-1.5 text-[10px] text-[#37352F] font-bold uppercase tracking-wider">
            <Sparkles className="h-3 w-3 text-purple-600 animate-pulse" />
            <span>AI Relation Engine</span>
          </div>
          <p className="leading-normal text-[#37352F]/60 text-[9px]">
            Linked nodes automatically construct transitive bridges in the system map. 
          </p>
          <div className="mt-1 flex items-center justify-between text-[9px] text-[#37352F]/50 font-mono font-bold">
            <span>Direct: {links.length}</span>
            <span className="text-green-600 font-bold uppercase text-[8px]">Optimized</span>
          </div>
        </div>
      </div>
      
    </div>
  );
}
