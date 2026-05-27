import { useState, useEffect } from 'react';
import { DocumentPage, LinkConnection, AutomationRule, AutomationLog, PropertyType } from './types';
import { INITIAL_W_STATE } from './data/mockData';
import Sidebar from './components/Sidebar';
import DocumentEditor from './components/DocumentEditor';
import DatabaseView from './components/DatabaseView';
import GraphVisualizer from './components/GraphVisualizer';
import AutomationPanel from './components/AutomationPanel';
import CopilotPanel from './components/CopilotPanel';
import { 
  Network, 
  Sparkles, 
  Brain, 
  LayoutDashboard, 
  Wrench, 
  GitCommit, 
  Settings, 
  CheckSquare,
  PanelLeftClose,
  PanelLeft,
  Maximize2,
  Minimize2,
  Columns
} from 'lucide-react';

export default function App() {
  // Collapsible sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('gn_sidebar_collapsed') === 'true';
  });

  // Editor layout mode: 'split' or 'full' (full-window distraction-free Notion page mode)
  const [editorViewMode, setEditorViewMode] = useState<'split' | 'full'>(() => {
    return (localStorage.getItem('gn_editor_view_mode') as 'split' | 'full') || 'split';
  });

  // Load workspace configuration from memory/storage
  const [pages, setPages] = useState<DocumentPage[]>(() => {
    const local = localStorage.getItem('gn_pages');
    return local ? JSON.parse(local) : INITIAL_W_STATE.pages;
  });

  const [links, setLinks] = useState<LinkConnection[]>(() => {
    const local = localStorage.getItem('gn_links');
    return local ? JSON.parse(local) : INITIAL_W_STATE.links;
  });

  const [automations, setAutomations] = useState<AutomationRule[]>(() => {
    const local = localStorage.getItem('gn_automations');
    return local ? JSON.parse(local) : INITIAL_W_STATE.automations;
  });

  const [logs, setLogs] = useState<AutomationLog[]>(() => {
    const local = localStorage.getItem('gn_logs');
    return local ? JSON.parse(local) : INITIAL_W_STATE.logs;
  });

  const [activePageId, setActivePageId] = useState<string>(() => {
    const local = localStorage.getItem('gn_active_id');
    return local || 'vision-aim';
  });

  // Sidebar tab context
  const [activeTab, setActiveTab] = useState<'editor' | 'automations' | 'graph'>('editor');

  // Sync state back to client storage local cache
  useEffect(() => {
    localStorage.setItem('gn_pages', JSON.stringify(pages));
  }, [pages]);

  useEffect(() => {
    localStorage.setItem('gn_links', JSON.stringify(links));
  }, [links]);

  useEffect(() => {
    localStorage.setItem('gn_automations', JSON.stringify(automations));
  }, [automations]);

  useEffect(() => {
    localStorage.setItem('gn_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('gn_active_id', activePageId);
  }, [activePageId]);

  useEffect(() => {
    localStorage.setItem('gn_sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem('gn_editor_view_mode', editorViewMode);
  }, [editorViewMode]);

  // Current selected page
  const activePage = pages.find((p) => p.id === activePageId) || pages[0] || INITIAL_W_STATE.pages[0];

  // Helper: Append diagnostic log messages
  const addLog = (ruleName: string, details: string) => {
    const newLog: AutomationLog = {
      id: `log-${Date.now()}`,
      ruleName,
      timestamp: new Date().toISOString(),
      status: 'success',
      details,
    };
    setLogs((prev) => [newLog, ...prev].slice(0, 50)); // limits list size to 50 items
  };

  // Task automations matcher engine
  const evaluateRuleTriggers = (rowId: string, ruleCellName: string, updatedVal: any) => {
    // Retrieve metadata for modifying page
    const targetRow = pages.find((p) => p.id === rowId);
    if (!targetRow) return;

    // Scan active schema configurations for on_property_change rules
    const targetRules = automations.filter(
      (rule) =>
        rule.isActive &&
        rule.triggerType === 'on_property_change' &&
        rule.triggerConfig.propertyName === ruleCellName &&
        rule.triggerConfig.propertyValue === updatedVal
    );

    targetRules.forEach((rule) => {
      // 1. Action Type: Generate Auto Link
      if (rule.actionType === 'auto_link' && rule.actionConfig.targetPageId) {
        const destPageId = rule.actionConfig.targetPageId;
        const exists = links.some(
          (edge) =>
            (edge.fromId === rowId && edge.toId === destPageId) ||
            (edge.fromId === destPageId && edge.toId === rowId)
        );

        if (!exists) {
          setLinks((prev) => [...prev, { fromId: rowId, toId: destPageId }]);
          const destTitle = pages.find((p) => p.id === destPageId)?.title || destPageId;
          addLog(
            rule.name,
            `Triggered: property "${ruleCellName}" updated to "${updatedVal}" in task row "${targetRow.title}". Successfully mapped direct relationship closure link directly to "${destTitle}".`
          );
        }
      }

      // 2. Action Type: Set specific property cells
      if (rule.actionType === 'set_property' && rule.actionConfig.propertyName) {
        const bindProp = rule.actionConfig.propertyName;
        const bindVal = rule.actionConfig.propertyValue;

        setPages((currentPages) =>
          currentPages.map((p) => {
            if (p.id === rowId) {
              return {
                ...p,
                properties: { ...p.properties, [bindProp]: bindVal },
                updatedAt: new Date().toISOString(),
              };
            }
            return p;
          })
        );

        addLog(
          rule.name,
          `Triggered: property "${ruleCellName}" changed to "${updatedVal}". Automatically updated target column cell "${bindProp}" to "${bindVal}".`
        );
      }
    });
  };

  // Callback to create generic page/documents or databases
  const handleCreatePage = (
    isDatabase: boolean,
    isDatabaseRowId: string | null = null,
    initialProperties?: Record<string, any>,
    customTitle?: string
  ) => {
    const newId = `page-${Date.now()}`;
    const newPage: DocumentPage = {
      id: newId,
      title: customTitle || (isDatabase ? 'Untitled Database' : isDatabaseRowId ? 'Untitled Node entry' : 'Untitled Document'),
      icon: isDatabase ? '🗃️' : '📄',
      content: isDatabase 
        ? `# Untitled Database\n\nSheet container details.` 
        : `# Untitled Document\n\nStart modeling text outlines. Link pages to calculate transitive paths.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDatabase,
      databaseId: isDatabaseRowId,
      parentId: isDatabaseRowId,
      properties: initialProperties || {},
      propertyConfigs: isDatabase
        ? [
            { id: `prop-${Date.now()}-1`, name: 'Status', type: 'select', options: ['Idea', 'In Progress', 'Done'] },
            { id: `prop-${Date.now()}-2`, name: 'Priority', type: 'select', options: ['High', 'Medium', 'Low'] },
          ]
        : undefined,
    };

    setPages((prev) => [...prev, newPage]);
    setActivePageId(newId);
    setActiveTab('editor');

    // Run custom 'on_page_created' automations
    const creationRules = automations.filter((rule) => rule.isActive && rule.triggerType === 'on_page_created');
    creationRules.forEach((rule) => {
      addLog(
        rule.name,
        `Triggered: newly created page document "${newPage.title}". Evaluated action model "${rule.actionType}" as successful.`
      );
    });
  };

  // Callback to update columns properties
  const handleUpdateRowProperty = (rowId: string, propertyName: string, value: any) => {
    setPages((prevPages) =>
      prevPages.map((p) => {
        if (p.id === rowId) {
          if (propertyName === '_title') {
            return { ...p, title: value, updatedAt: new Date().toISOString() };
          } else {
            return {
              ...p,
              properties: { ...p.properties, [propertyName]: value },
              updatedAt: new Date().toISOString(),
            };
          }
        }
        return p;
      })
    );

    // Evaluate workspace automation rule triggers
    if (propertyName !== '_title') {
      evaluateRuleTriggers(rowId, propertyName, value);
    }
  };

  // Callback to update general page content body
  const handleUpdatePageGeneric = (id: string, updates: Partial<DocumentPage>) => {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );
  };

  const handleDeletePage = (id: string) => {
    // Delete target page and children rows if database
    setPages((prev) => prev.filter((p) => p.id !== id && p.databaseId !== id));
    // Clean orphan links
    setLinks((prev) => prev.filter((l) => l.fromId !== id && l.toId !== id));

    if (activePageId === id) {
      setActivePageId('vision-aim');
    }
  };

  // Manage Link Connections (Add/Remove)
  const handleAddLink = (fromId: string, toId: string) => {
    const alreadyConnected = links.some(
      (l) => (l.fromId === fromId && l.toId === toId) || (l.fromId === toId && l.toId === fromId)
    );

    if (!alreadyConnected && fromId !== toId) {
      setLinks((prev) => [...prev, { fromId, toId }]);

      // Trigger 'on_link_added' automations if any
      const matchingAutomations = automations.filter((r) => r.isActive && r.triggerType === 'on_link_added');
      matchingAutomations.forEach((rule) => {
        addLog(
          rule.name,
          `Triggered: direct relational link established between "${pages.find((p) => p.id === fromId)?.title}" and "${pages.find((p) => p.id === toId)?.title}".`
        );
      });
    }
  };

  const handleRemoveLink = (fromId: string, toId: string) => {
    setLinks((prev) =>
      prev.filter((l) => !((l.fromId === fromId && l.toId === toId) || (l.fromId === toId && l.toId === fromId)))
    );
  };

  // Add customized property configurations to databases
  const handleAddDatabaseColumn = (
    databaseId: string,
    name: string,
    type: PropertyType,
    options: string[]
  ) => {
    setPages((prev) =>
      prev.map((p) => {
        if (p.id === databaseId) {
          const currentConfigs = p.propertyConfigs || [];
          return {
            ...p,
            propertyConfigs: [
              ...currentConfigs,
              { id: `prop-cfg-${Date.now()}`, name, type, options },
            ],
          };
        }
        return p;
      })
    );
  };

  const handleDeleteDatabaseColumn = (databaseId: string, columnId: string) => {
    setPages((prev) =>
      prev.map((p) => {
        if (p.id === databaseId) {
          return {
            ...p,
            propertyConfigs: (p.propertyConfigs || []).filter((cfg) => cfg.id !== columnId),
          };
        }
        return p;
      })
    );
  };

  // Custom Automation Config actions
  const handleAddAutomationRule = (rule: Omit<AutomationRule, 'id'>) => {
    const newRule: AutomationRule = {
      ...rule,
      id: `rule-${Date.now()}`,
    };
    setAutomations((prev) => [...prev, newRule]);
    addLog('System Rule Engine', `Successfully registered new automation trigger: "${rule.name}".`);
  };

  const handleToggleAutomationRule = (id: string) => {
    setAutomations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
  };

  const handleDeleteAutomationRule = (id: string) => {
    setAutomations((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div id="full-workspace-view" className="flex h-screen w-screen bg-[#F9F9F8] font-sans text-[#1A1A1A] overflow-hidden">
      
      {/* 1. Sidebar Panel */}
      {!isSidebarCollapsed && (
        <Sidebar
          pages={pages}
          activePageId={activePageId}
          onSelectPage={setActivePageId}
          onCreatePage={(isDb) => handleCreatePage(isDb)}
          onDeletePage={handleDeletePage}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          links={links}
        />
      )}

      {/* 2. Main Dashboard panel */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#F9F9F8]">
        
        {/* Workspace Action Header bar */}
        <header className="px-6 py-3.5 border-b border-[#E8E8E6] bg-white select-none flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-[#37352F]/50 font-medium">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 mr-1 hover:bg-[#F1F1EF] text-[#37352F]/65 hover:text-[#37352F] rounded-md transition-all cursor-pointer flex items-center justify-center"
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>

            <span 
              className="font-bold text-[#37352F] hover:underline cursor-pointer flex items-center gap-1 shrink-0" 
              onClick={() => setActiveTab('editor')}
            >
              Ziel Workspace
            </span>
            <span className="text-[#37352F]/30 select-none">/</span>
            {activeTab === 'editor' ? (
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                {(() => {
                  const crumbs = [];
                  let curr: DocumentPage | undefined = activePage;
                  const visited = new Set<string>();
                  while (curr) {
                    if (visited.has(curr.id)) break;
                    visited.add(curr.id);
                    crumbs.unshift(curr);
                    curr = curr.parentId ? pages.find(p => p.id === curr?.parentId) : undefined;
                  }
                  return crumbs.map((crumb, idx) => (
                    <div key={crumb.id} className="flex items-center gap-1.5 min-w-0">
                      {idx > 0 && <span className="text-[#37352F]/30 select-none">/</span>}
                      <button
                        onClick={() => setActivePageId(crumb.id)}
                        className={`hover:text-[#37352F] hover:underline cursor-pointer flex items-center gap-1 font-semibold truncate ${
                          idx === crumbs.length - 1 ? 'text-[#37352F]' : ''
                        }`}
                      >
                        <span className="shrink-0">{crumb.icon}</span>
                        <span className="truncate">{crumb.title}</span>
                      </button>
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <span className="font-bold text-[#37352F]">
                {activeTab === 'automations' ? 'Automation Controller Platform' : 'System Graph Closure'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Split / Full-Window layout toggles */}
            {activeTab === 'editor' && (
              <div className="flex items-center gap-1 bg-[#F1F1EF] p-0.5 rounded-lg border border-[#E8E8E6] mr-2">
                <button
                  onClick={() => setEditorViewMode('split')}
                  className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-md font-bold cursor-pointer transition-all ${
                    editorViewMode === 'split'
                      ? 'bg-white text-[#37352F] shadow-3xs'
                      : 'text-[#37352F]/60 hover:text-[#37352F]'
                  }`}
                  title="Show Split Dashboard (Editor, Graph Visualizer, & AI Copilot side-by-side)"
                >
                  <Columns className="h-3 w-3" />
                  <span>Split Board</span>
                </button>
                <button
                  onClick={() => setEditorViewMode('full')}
                  className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-md font-bold cursor-pointer transition-all ${
                    editorViewMode === 'full'
                      ? 'bg-white text-[#37352F] shadow-3xs'
                      : 'text-[#37352F]/60 hover:text-[#37352F]'
                  }`}
                  title="Expand Page to Full Window (Notion-style centered distraction-free canvas)"
                >
                  <Maximize2 className="h-3 w-3" />
                  <span>Full Window</span>
                </button>
              </div>
            )}

            <span className="text-[10px] uppercase font-mono px-2 py-1 bg-[#F1F1EF] text-[#37352F]/60 border border-[#E8E8E6] rounded-md font-semibold">
              UTC: 2026-05-27
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-1 bg-purple-50 text-purple-700 border border-purple-150 rounded-md flex items-center gap-1 font-bold">
              <Sparkles className="h-3 w-3 text-purple-600 animate-pulse" />
              Aura Copilot Active
            </span>
          </div>
        </header>

        {/* Workspace split columns container */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin bg-[#F9F9F8]">
          {activeTab === 'editor' && (
            editorViewMode === 'full' ? (
              /* Full Centered Notion Page Workspace */
              <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 pb-20 animate-[fadeIn_0.15s_ease-out]">
                {activePage.isDatabase ? (
                  <DatabaseView
                    databasePage={activePage}
                    pages={pages}
                    onCreateRow={(dbId, initialProps, customTitle) => handleCreatePage(false, dbId, initialProps, customTitle)}
                    onUpdateRowProperty={handleUpdateRowProperty}
                    onAddColumn={handleAddDatabaseColumn}
                    onDeleteColumn={handleDeleteDatabaseColumn}
                    onSelectPage={setActivePageId}
                    onDeletePage={handleDeletePage}
                    onUpdatePage={handleUpdatePageGeneric}
                  />
                ) : (
                  <DocumentEditor
                    page={activePage}
                    pages={pages}
                    links={links}
                    onUpdatePage={handleUpdatePageGeneric}
                    onAddLink={handleAddLink}
                    onRemoveLink={handleRemoveLink}
                  />
                )}
              </div>
            ) : (
              /* Split Panel View: Core Editor Left, Copilot AI Right */
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start h-full">
                
                {/* Left View Column (Editor details OR database grid AND visualizer graph below) */}
                <div className="xl:col-span-2 flex flex-col gap-6">
                  {activePage.isDatabase ? (
                    <DatabaseView
                      databasePage={activePage}
                      pages={pages}
                      onCreateRow={(dbId, initialProps, customTitle) => handleCreatePage(false, dbId, initialProps, customTitle)}
                      onUpdateRowProperty={handleUpdateRowProperty}
                      onAddColumn={handleAddDatabaseColumn}
                      onDeleteColumn={handleDeleteDatabaseColumn}
                      onSelectPage={setActivePageId}
                      onDeletePage={handleDeletePage}
                      onUpdatePage={handleUpdatePageGeneric}
                    />
                  ) : (
                    <DocumentEditor
                      page={activePage}
                      pages={pages}
                      links={links}
                      onUpdatePage={handleUpdatePageGeneric}
                      onAddLink={handleAddLink}
                      onRemoveLink={handleRemoveLink}
                    />
                  )}

                  {/* SVG Live mapping visual diagram */}
                  <GraphVisualizer
                    pages={pages}
                    links={links}
                    activePageId={activePageId}
                    onSelectPage={setActivePageId}
                    onAddLink={handleAddLink}
                  />
                </div>

                {/* Right panel (Aura Assist Q&A Copilots) */}
                <div className="flex flex-col h-full">
                  <CopilotPanel
                    activePage={activePage}
                    pages={pages}
                    links={links}
                    onAddLink={handleAddLink}
                  />
                </div>

              </div>
            )
          )}

          {activeTab === 'automations' && (
            <AutomationPanel
              automations={automations}
              logs={logs}
              pages={pages}
              onAddAutomation={handleAddAutomationRule}
              onToggleAutomation={handleToggleAutomationRule}
              onDeleteAutomation={handleDeleteAutomationRule}
              onClearLogs={() => setLogs([])}
            />
          )}
        </div>

      </div>

    </div>
  );
}
