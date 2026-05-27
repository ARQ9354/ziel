import React, { useState } from 'react';
import { DocumentPage, DatabasePropertyConfig, PropertyType } from '../types';
import { 
  Plus, 
  Settings, 
  ChevronRight, 
  HelpCircle, 
  Calendar, 
  Hash, 
  Type as TextIcon, 
  CheckSquare, 
  Trash2, 
  List, 
  Columns, 
  Table,
  Sparkles,
  ToggleLeft
} from 'lucide-react';

interface DatabaseViewProps {
  databasePage: DocumentPage;
  pages: DocumentPage[];
  onCreateRow: (databaseId: string, initialProperties?: Record<string, any>, customTitle?: string) => void;
  onUpdateRowProperty: (rowId: string, propertyName: string, value: any) => void;
  onAddColumn: (databaseId: string, name: string, type: PropertyType, options: string[]) => void;
  onDeleteColumn: (databaseId: string, columnId: string) => void;
  onSelectPage: (id: string) => void;
  onDeletePage: (id: string) => void;
  onUpdatePage: (id: string, updates: Partial<DocumentPage>) => void;
}

interface PresetRowDef {
  title: string;
  properties: Record<string, any>;
}

interface DatabasePresetDef {
  name: string;
  icon: string;
  description: string;
  propertyConfigs: DatabasePropertyConfig[];
  sampleRows: PresetRowDef[];
}

const DATABASE_PRESETS: DatabasePresetDef[] = [
  {
    name: 'Product Agile Sprint Board',
    icon: '🏃',
    description: 'Track ongoing engineering sprints, features, priority tiers, and release checkpoints.',
    propertyConfigs: [
      { id: 'status-col-1', name: 'Status', type: 'select', options: ['Backlog', 'Ready', 'In Progress', 'QA Status', 'Completed ✅'] },
      { id: 'priority-col-2', name: 'Priority', type: 'select', options: ['Urgent 🚨', 'High', 'Medium', 'Low'] },
      { id: 'assignee-col-3', name: 'Assignee', type: 'text', options: [] },
      { id: 'due-date-col-4', name: 'Due Date', type: 'date', options: [] }
    ],
    sampleRows: [
      {
        title: 'Design SVG Interactive Graph Layout Diagram',
        properties: {
          'Status': 'In Progress',
          'Priority': 'High',
          'Assignee': 'Bruce Banner',
          'Due Date': '2026-06-05'
        }
      },
      {
        title: 'Formulate Transitive Closure Nodes Relationship API',
        properties: {
          'Status': 'Ready',
          'Priority': 'Urgent 🚨',
          'Assignee': 'Tony Stark',
          'Due Date': '2026-05-30'
        }
      }
    ]
  },
  {
    name: 'Syllabus & Course Reading List',
    icon: '📖',
    description: 'Structure academic syllabuses, book lists, chapter milestones, and ongoing notes.',
    propertyConfigs: [
      { id: 'read-status-1', name: 'Status', type: 'select', options: ['To Read', 'Active Reading ✍️', 'Finished'] },
      { id: 'topic-category-2', name: 'Topic', type: 'select', options: ['Computer Architecture', 'Distributed Systems', 'Philosophy', 'Product Design'] },
      { id: 'author-3', name: 'Author', type: 'text', options: [] },
      { id: 'deadline-4', name: 'Target Date', type: 'date', options: [] }
    ],
    sampleRows: [
      {
        title: 'Designing Data-Intensive Applications',
        properties: {
          'Status': 'Active Reading ✍️',
          'Topic': 'Distributed Systems',
          'Author': 'Martin Kleppmann',
          'Target Date': '2026-06-25'
        }
      },
      {
        title: 'The Design of Everyday Things',
        properties: {
          'Status': 'Finished',
          'Topic': 'Product Design',
          'Author': 'Don Norman',
          'Target Date': '2026-04-18'
        }
      }
    ]
  },
  {
    name: 'CRM Client Sales Deals Pipeline',
    icon: '💰',
    description: 'Track live corporate contacts, negotiations, follow-up dates, and values.',
    propertyConfigs: [
      { id: 'stage-1', name: 'Deal Stage', type: 'select', options: ['Discovery Lead', 'Proposal Sent', 'Negotiation', 'Contract Signed 🎉', 'Closed Lost'] },
      { id: 'value-2', name: 'Estimated Value ($)', type: 'text', options: [] },
      { id: 'lead-contact-3', name: 'Lead Contact', type: 'text', options: [] },
      { id: 'follow-up-4', name: 'Follow-Up Date', type: 'date', options: [] }
    ],
    sampleRows: [
      {
        title: 'Acme Corp Enterprise SaaS Licensing',
        properties: {
          'Deal Stage': 'Proposal Sent',
          'Estimated Value ($)': '$45,000',
          'Lead Contact': 'Sarah Connor',
          'Follow-Up Date': '2026-06-12'
        }
      },
      {
        title: 'Stark Industries Arc Engine Integration License',
        properties: {
          'Deal Stage': 'Contract Signed 🎉',
          'Estimated Value ($)': '$1,200,000',
          'Lead Contact': 'Tony Stark',
          'Follow-Up Date': '2026-05-28'
        }
      }
    ]
  },
  {
    name: 'Habits & Wellness Routine Log',
    icon: '⚡',
    description: 'Establish daily workouts, technology readings, or mindfulness practices.',
    propertyConfigs: [
      { id: 'habit-cat-1', name: 'Category', type: 'select', options: ['Fitness', 'Professional Learning', 'Mindfulness', 'Hobbies'] },
      { id: 'freq-2', name: 'Frequency', type: 'select', options: ['Daily', 'Weekly', 'Bi-Weekly'] },
      { id: 'done-today-3', name: 'Completed Today', type: 'checkbox', options: [] },
      { id: 'streak-notes-4', name: 'Progress Notes', type: 'text', options: [] }
    ],
    sampleRows: [
      {
        title: 'Read 25 pages of software design documentation',
        properties: {
          'Category': 'Professional Learning',
          'Frequency': 'Daily',
          'Completed Today': true,
          'Progress Notes': 'Finished the Force-directed layout coordinate calculations'
        }
      },
      {
        title: 'Morning breathing yoga session (15min)',
        properties: {
          'Category': 'Mindfulness',
          'Frequency': 'Daily',
          'Completed Today': false,
          'Progress Notes': 'Plan to practice before booting server sandbox'
        }
      }
    ]
  }
];

export default function DatabaseView({
  databasePage,
  pages,
  onCreateRow,
  onUpdateRowProperty,
  onAddColumn,
  onDeleteColumn,
  onSelectPage,
  onDeletePage,
  onUpdatePage,
}: DatabaseViewProps) {
  // Fetch rows belonging to this database
  const rows = pages.filter((p) => p.databaseId === databasePage.id);
  const propertyConfigs = databasePage.propertyConfigs || [];

  // Multiple Notion Layouts
  const [layoutMode, setLayoutMode] = useState<'table' | 'kanban' | 'list'>('table');
  const [showPresetsSection, setShowPresetsSection] = useState(true);

  // Select configurations for Kanban grouping
  const selectConfigs = propertyConfigs.filter((cfg) => cfg.type === 'select');
  const [groupPropertyId, setGroupPropertyId] = useState<string>(
    selectConfigs.find(cfg => cfg.name === 'Status')?.id || selectConfigs[0]?.id || ''
  );
  
  const activeGroupCfg = selectConfigs.find(cfg => cfg.id === groupPropertyId) || selectConfigs[0];

  // Local state for creating new columns
  const [showAddCol, setShowAddCol] = useState(false);
  const [colName, setColName] = useState('');
  const [colType, setColType] = useState<PropertyType>('text');
  const [colOptionsStr, setColOptionsStr] = useState('');

  const handleCreateColumn = () => {
    if (!colName.trim()) return;
    const options = colOptionsStr
      .split(',')
      .map((opt) => opt.trim())
      .filter((opt) => opt !== '');
    onAddColumn(databasePage.id, colName.trim(), colType, options);
    setColName('');
    setColType('text');
    setColOptionsStr('');
    setShowAddCol(false);
  };

  const applyPresetBlueprint = (preset: typeof DATABASE_PRESETS[0]) => {
    const defaultTitle = databasePage.title === 'Untitled Database' || !databasePage.title;
    const newTitle = defaultTitle ? preset.name : databasePage.title;

    onUpdatePage(databasePage.id, {
      title: newTitle,
      icon: preset.icon,
      propertyConfigs: preset.propertyConfigs
    });

    preset.sampleRows.forEach((row) => {
      onCreateRow(databasePage.id, row.properties, row.title);
    });
  };

  const getPropIcon = (type: PropertyType) => {
    switch (type) {
      case 'text':
        return <TextIcon className="h-3 w-3 text-[#37352F]/50" />;
      case 'select':
        return <List className="h-3 w-3 text-indigo-600" />;
      case 'checkbox':
        return <CheckSquare className="h-3 w-3 text-emerald-600" />;
      case 'date':
        return <Calendar className="h-3 w-3 text-amber-600" />;
    }
  };

  // Kanban Columns Logic
  const kanbanColumns = activeGroupCfg ? ['', ...(activeGroupCfg.options || [])] : [''];

  const getRowsForKanbanColumn = (option: string) => {
    if (!activeGroupCfg) return rows;
    const colName = activeGroupCfg.name;
    return rows.filter((r) => {
      const val = r.properties[colName];
      if (!option) {
        return !val; // Blank or unassigned status
      }
      return val === option;
    });
  };

  return (
    <div className="bg-white border border-[#E8E8E6] rounded-xl overflow-hidden shadow-sm flex flex-col">
      
      {/* Table Action Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#E8E8E6] bg-[#F9F9F8] p-4 gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{databasePage.icon || '🗃️'}</span>
            <div>
              <input
                type="text"
                value={databasePage.title}
                onChange={(e) => onUpdatePage(databasePage.id, { title: e.target.value })}
                className="font-extrabold text-[#37352F] text-sm bg-transparent outline-none focus:border-b border-[#37352F] pb-0.5"
                placeholder="Untitled Database Schema"
              />
              <p className="text-[10px] text-[#37352F]/50 font-medium">
                Columns: {propertyConfigs.length} • Rows: {rows.length}
              </p>
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="hidden sm:block h-6 w-[1px] bg-[#E8E8E6]"></div>

          {/* Multi View Selector styled perfectly like Notion */}
          <div className="flex items-center bg-[#F1F1EF] p-0.5 rounded-lg border border-[#E8E8E6]">
            <button
              onClick={() => setLayoutMode('table')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                layoutMode === 'table' ? 'bg-white text-[#37352F] shadow-2xs' : 'text-[#37352F]/50 hover:text-[#37352F]'
              }`}
            >
              <Table className="h-3 w-3" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setLayoutMode('kanban')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                layoutMode === 'kanban' ? 'bg-white text-[#37352F] shadow-2xs' : 'text-[#37352F]/50 hover:text-[#37352F]'
              }`}
            >
              <Columns className="h-3 w-3" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setLayoutMode('list')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                layoutMode === 'list' ? 'bg-white text-[#37352F] shadow-2xs' : 'text-[#37352F]/50 hover:text-[#37352F]'
              }`}
            >
              <List className="h-3 w-3" />
              <span>List</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowPresetsSection(!showPresetsSection)}
            className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 hover:bg-[#F1F1EF] border border-[#E8E8E6] rounded-lg text-[#37352F]/70 font-bold transition-all"
            title="Toggle Database Presets & Blueprints suggestions bar"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-600 animate-pulse" />
            <span>Presets Suggestions</span>
          </button>

          {/* Kanban option selector */}
          {layoutMode === 'kanban' && selectConfigs.length > 1 && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-[#37352F]/50 font-semibold">Group by:</span>
              <select
                value={groupPropertyId}
                onChange={(e) => setGroupPropertyId(e.target.value)}
                className="bg-white border border-[#E8E8E6] text-[#37352F] rounded-lg text-xs p-1 outline-none font-bold cursor-pointer"
              >
                {selectConfigs.map(cfg => (
                  <option key={cfg.id} value={cfg.id}>{cfg.name}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => setShowAddCol(!showAddCol)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E8E8E6] text-xs rounded-lg hover:bg-[#F1F1EF] text-[#37352F] font-bold cursor-pointer transition-all"
          >
            <Settings className="h-3.5 w-3.5 text-indigo-600" />
            <span>Manage Columns</span>
          </button>
        </div>
      </div>

      {/* ----------------- INTUITIVE BLUEPRINT SUGGESTIONS PANEL ----------------- */}
      {showPresetsSection && (
        <div className="p-4 bg-purple-50/40 border-b border-[#E8E8E6] select-none text-normal-body animate-[fadeIn_0.12s_ease-out]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-purple-950 flex items-center gap-1.5 uppercase tracking-widest leading-none">
              <Sparkles className="h-3.5 w-3.5 text-purple-600 animate-pulse shrink-0" />
              <span>Blueprint Database Suggesstions</span>
            </span>
            <button 
              onClick={() => setShowPresetsSection(false)}
              className="text-[9px] text-purple-800 hover:text-purple-950 font-extrabold uppercase"
            >
              ✕ Hide
            </button>
          </div>
          <p className="text-[11.5px] text-purple-900/70 mb-3 leading-relaxed max-w-2xl">
            Need a starting structure? Click any recommendation blueprint below to instantly configure custom selects, приоритет tags, text categories, date columns, and functional sample lists!
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {DATABASE_PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => {
                  applyPresetBlueprint(p);
                  setShowPresetsSection(false);
                }}
                className="group flex flex-col text-left p-3 bg-white border border-[#E8E8E6] hover:border-purple-300 hover:ring-2 hover:ring-purple-200/50 rounded-xl cursor-pointer transition-all hover:-translate-y-0.5 shadow-3xs"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg bg-purple-50 p-1.5 rounded-lg border border-purple-100">{p.icon}</span>
                  <span className="font-extrabold text-[12px] text-[#37352F]">{p.name}</span>
                </div>
                <p className="text-[10.5px] text-[#37352F]/60 line-clamp-2 leading-relaxed mb-3">
                  {p.description}
                </p>
                <div className="mt-auto pt-2 border-t border-[#F1F1EF] w-full flex flex-wrap gap-1 text-[8px] font-mono font-bold text-purple-800">
                  {p.propertyConfigs.map(c => (
                    <span key={c.name} className="px-1.5 py-0.5 bg-purple-50/75 border border-purple-100 rounded uppercase">
                      {c.name}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add Column drawer controls */}
      {showAddCol && (
        <div className="bg-[#FAF9F6] border-b border-[#E8E8E6] p-4 text-xs select-none">
          <div className="max-w-xl flex flex-col gap-3">
            <h4 className="font-bold text-[#37352F] uppercase tracking-wide text-[10px] text-[#37352F]/65">Create Schema Column Property</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <span className="font-bold text-[#37352F]/70 text-[10px] uppercase">Property Name</span>
                <input
                  type="text"
                  placeholder="e.g. Due Date"
                  value={colName}
                  onChange={(e) => setColName(e.target.value)}
                  className="bg-white border border-[#E8E8E6] rounded-md px-2.5 py-1 text-xs text-[#37352F] outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-bold text-[#37352F]/70 text-[10px] uppercase">Cell Value Type</span>
                <select
                  value={colType}
                  onChange={(e) => setColType(e.target.value as PropertyType)}
                  className="bg-white border border-[#E8E8E6] rounded-md px-2 py-1 text-xs outline-none"
                >
                  <option value="text">Text value</option>
                  <option value="select">Custom select dropdown menu</option>
                  <option value="checkbox">Toggle checkbox</option>
                  <option value="date">Date calendar picker</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-bold text-[#37352F]/70 text-[10px] uppercase">Select options</span>
                <input
                  type="text"
                  disabled={colType !== 'select'}
                  placeholder="Comma-separated: High, Low"
                  value={colOptionsStr}
                  onChange={(e) => setColOptionsStr(e.target.value)}
                  className="bg-white border border-[#E8E8E6] rounded-md px-2 py-1 text-xs outline-none disabled:bg-zinc-100/60"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={handleCreateColumn}
                className="px-4 py-1.5 bg-[#37352F] hover:bg-[#4B4841] text-white rounded-lg font-bold"
              >
                Append Column Schema
              </button>
              
              <button
                onClick={() => setShowAddCol(false)}
                className="px-3 py-1.5 hover:bg-[#E8E8E6] rounded-lg text-zinc-500 hover:text-black font-semibold"
              >
                Close
              </button>
            </div>
          </div>

          {/* Delete columns header indicators */}
          {propertyConfigs.length > 0 && (
            <div className="mt-4 border-t border-[#E8E8E6] pt-3.5">
              <span className="block font-bold text-[#37352F]/50 uppercase text-[10px] mb-2 tracking-widest">Remove columns properties</span>
              <div className="flex flex-wrap gap-2">
                {propertyConfigs.map((col) => (
                  <div key={col.id} className="flex items-center gap-1.5 bg-white border border-[#E8E8E6] rounded-md pl-2.5 pr-1.5 py-1 font-semibold text-xs text-[#37352F]">
                    <span>{col.name}</span>
                    <button
                      onClick={() => {
                        if (confirm(`Remove column "${col.name}" and delete all values of it across database sheets?`)) {
                          onDeleteColumn(databasePage.id, col.id);
                        }
                      }}
                      className="p-0.5 hover:bg-red-50 text-red-650 hover:text-red-800 rounded"
                      title="Delete column"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* LAYOUT 1: TABLE VIEW */}
      {layoutMode === 'table' && (
        <div className="overflow-x-auto select-none bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF9F6]/50 border-b border-[#E8E8E6] text-[10px] font-bold text-[#37352F]/40 tracking-widest uppercase select-none">
                <th className="py-2.5 px-4 font-bold border-r border-[#E8E8E6]">Document Title Node</th>
                {propertyConfigs.map((col) => (
                  <th key={col.id} className="py-2.5 px-4 font-bold border-r border-[#E8E8E6]">
                    <div className="flex items-center gap-1.5">
                      {getPropIcon(col.type)}
                      <span>{col.name}</span>
                    </div>
                  </th>
                ))}
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E6] select-text">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-[#F7F7F5]/40 transition-colors group text-sm">
                  {/* Title node */}
                  <td className="p-2 border-r border-[#E8E8E6] align-middle">
                    <div className="flex items-center gap-1.5 min-w-[200px]">
                      <span className="text-base shrink-0">{row.icon || '📄'}</span>
                      <input
                        type="text"
                        value={row.title}
                        onChange={(e) => onUpdateRowProperty(row.id, '_title', e.target.value)}
                        className="bg-transparent border border-transparent hover:border-[#E8E8E6] focus:border-[#37352F] text-xs font-bold text-[#37352F] outline-none rounded px-1.5 py-0.5 w-full flex-1"
                      />
                    </div>
                  </td>

                  {/* Schema values */}
                  {propertyConfigs.map((col) => {
                    const val = row.properties[col.name];

                    return (
                      <td key={col.id} className="p-2 border-r border-[#E8E8E6] align-middle">
                        <div className="min-w-[140px]">
                          {col.type === 'select' ? (
                            <select
                              value={val || ''}
                              onChange={(e) => onUpdateRowProperty(row.id, col.name, e.target.value)}
                              className="text-xs bg-transparent border border-transparent hover:border-[#E8E8E6] rounded w-full py-1 px-1 text-[#37352F] focus:bg-white focus:outline-none focus:border-[#37352F] cursor-pointer"
                            >
                              <option value="">— empty</option>
                              {col.options?.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : col.type === 'checkbox' ? (
                            <div className="flex items-center justify-center py-1">
                              <input
                                type="checkbox"
                                checked={!!val}
                                onChange={(e) => onUpdateRowProperty(row.id, col.name, e.target.checked)}
                                className="h-4 w-4 rounded border-[#E8E8E6] text-[#37352F] focus:ring-0 cursor-pointer"
                              />
                            </div>
                          ) : col.type === 'date' ? (
                            <input
                              type="date"
                              value={val || ''}
                              onChange={(e) => onUpdateRowProperty(row.id, col.name, e.target.value)}
                              className="text-xs bg-transparent border border-transparent hover:border-[#E8E8E6] rounded px-1 py-0.5 w-full font-mono"
                            />
                          ) : (
                            <input
                              type="text"
                              value={val || ''}
                              onChange={(e) => onUpdateRowProperty(row.id, col.name, e.target.value)}
                              className="text-xs bg-transparent border border-transparent hover:border-[#E8E8E6] rounded px-1.5 py-0.5 w-full text-[#37352F] focus:bg-white focus:outline-none focus:border-[#37352F]"
                              placeholder="Empty text cell..."
                            />
                          )}
                        </div>
                      </td>
                    );
                  })}

                  <td className="p-2 text-right align-middle">
                    <div className="flex items-center justify-end gap-1 px-2">
                      <button
                        onClick={() => onSelectPage(row.id)}
                        className="p-1 px-2.5 text-[10.5px] hover:bg-[#F1F1EF] text-indigo-700 hover:text-indigo-950 rounded transition-all flex items-center gap-0.5 font-bold cursor-pointer"
                        title="Open sub-page canvas editor"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                        <span>Open Editor</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Remove this row item "${row.title || 'UntitledNode'}" and purge document?`)) {
                            onDeletePage(row.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-50 hover:text-rose-700 rounded text-[#37352F]/40 cursor-pointer transition-opacity"
                        title="Delete entry"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={propertyConfigs.length + 2} className="py-14 text-center text-[#37352F]/40 italic">
                    This table has no rows. Click "Add entry page" below to append, or select a Preset Blueprint above!
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Table bottom Row addition */}
          <div className="p-2 bg-white border-t border-[#E8E8E6] select-none">
            <button
              onClick={() => onCreateRow(databasePage.id)}
              className="px-3 py-1.5 text-xs text-[#37352F]/60 hover:text-black hover:bg-[#F1F1EF] rounded-lg flex items-center gap-1 font-bold cursor-pointer transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add a row page</span>
            </button>
          </div>
        </div>
      )}

      {/* LAYOUT 2: KANBAN BOARD VIEW */}
      {layoutMode === 'kanban' && (
        <div className="border-t border-[#E8E8E6] bg-[#FAF9F6]/30 p-4 overflow-x-auto select-none">
          {!activeGroupCfg ? (
            <div className="py-12 text-center text-xs text-[#37352F]/50 font-medium">
              Kanban view requires at least one select property. Click "Manage Columns" to build a dropdown select field.
            </div>
          ) : (
            <div className="flex items-start gap-4 min-w-[800px]">
              {kanbanColumns.map((colOption) => (
                <div key={colOption} className="flex-1 bg-white/60 border border-[#E8E8E6] rounded-xl p-3 flex flex-col gap-3.5 shadow-3xs">
                  {/* Kanban stage header card */}
                  <div className="flex items-center justify-between border-b border-[#F1F1EF] pb-2">
                    <span className="text-[10px] uppercase font-mono font-black text-[#37352F] flex items-center gap-1 bg-[#F1F1EF] px-2 py-0.5 rounded border border-[#E8E8E6]">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                      <span>{colOption || '📎 Unassigned'}</span>
                    </span>
                    <span className="text-[10px] text-[#37352F]/45 font-mono font-bold">
                      {getRowsForKanbanColumn(colOption).length} items
                    </span>
                  </div>

                  {/* Kanban card loop list */}
                  <div className="flex flex-col gap-2.5 min-h-[180px] overflow-y-auto pr-1">
                    {getRowsForKanbanColumn(colOption).map((row) => (
                      <div key={row.id} className="group bg-white border border-[#E8E8E6] hover:border-indigo-400 p-3.5 rounded-xl shadow-2xs hover:shadow-sm transition-all flex flex-col gap-2 text-xs">
                        {/* Title and navigation node */}
                        <div className="flex items-center justify-between gap-1.5 font-bold">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <span className="text-sm shrink-0">{row.icon || '📄'}</span>
                            <input
                              type="text"
                              value={row.title}
                              onChange={(e) => onUpdateRowProperty(row.id, '_title', e.target.value)}
                              className="bg-transparent border border-transparent hover:border-[#E8E8E6] focus:border-[#37352F] text-xs font-bold text-[#37352F] outline-none rounded truncate cursor-text"
                            />
                          </div>
                          <button
                            onClick={() => onSelectPage(row.id)}
                            className="p-1 hover:bg-[#F1F1EF] text-[#37352F]/50 hover:text-[#37352F] rounded transition-colors"
                            title="Open card detail"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Render other secondary properties in card body */}
                        <div className="flex flex-col gap-1 text-[10px] text-[#37352F]/70 pt-1 border-t border-[#F1F1EF]">
                          {propertyConfigs.filter(cfg => cfg.id !== activeGroupCfg.id).map(cfg => {
                            const val = row.properties[cfg.name];
                            return (
                              <div key={cfg.id} className="flex items-center justify-between py-0.5">
                                <span className="text-[#37352F]/50 flex items-center gap-1">
                                  {getPropIcon(cfg.type)}
                                  {cfg.name}:
                                </span>
                                {cfg.type === 'checkbox' ? (
                                  <input
                                    type="checkbox"
                                    checked={!!val}
                                    onChange={(e) => onUpdateRowProperty(row.id, cfg.name, e.target.checked)}
                                    className="h-3 w-3 border-[#E8E8E6] text-[#37352F] rounded focus:ring-0"
                                  />
                                ) : (
                                  <span className="font-semibold truncate max-w-[120px]">
                                    {val || '—'}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Swap group directly on board */}
                        <div className="flex items-center justify-between text-[10px] text-[#37352F]/60 pt-2 border-t border-[#F1F1EF] mt-1">
                          <span className="font-semibold text-[9px] uppercase tracking-wider text-[#37352F]/40">Move item:</span>
                          <select
                            value={row.properties[activeGroupCfg.name] || ''}
                            onChange={(e) => onUpdateRowProperty(row.id, activeGroupCfg.name, e.target.value)}
                            className="bg-[#FAF9F6] border border-[#E8E8E6] hover:bg-[#F1F1EF] text-[10px] font-bold rounded px-1 py-0.5 cursor-pointer text-[#37352F] outline-none"
                          >
                            <option value="">— Unassigned</option>
                            {activeGroupCfg.options?.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>

                        {/* Quick delete */}
                        <div className="self-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              if (confirm(`Delete card "${row.title || 'Untitled'}"?`)) {
                                onDeletePage(row.id);
                              }
                            }}
                            className="text-rose-605 hover:text-rose-800 text-[10px] font-semibold flex items-center gap-0.5 mt-1 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Column Add Task Button (Sets status directly!) */}
                  <button
                    onClick={() => onCreateRow(databasePage.id, colOption ? { [activeGroupCfg.name]: colOption } : {})}
                    className="w-full text-xs py-1.5 hover:bg-[#F1F1EF] text-[#37352F]/50 hover:text-[#37352F] rounded-lg border border-dashed border-[#E8E8E6] flex items-center justify-center gap-1 font-bold cursor-pointer transition-colors mt-2"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add row page</span>
                  </button>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LAYOUT 3: VERTICAL LIST VIEW */}
      {layoutMode === 'list' && (
        <div className="flex flex-col border-t border-[#E8E8E6] divide-y divide-[#E8E8E6] bg-white text-sm">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center justify-between p-3 px-4 hover:bg-[#F7F7F5]/70 transition-colors group">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={() => onSelectPage(row.id)}
                  className="p-1 hover:bg-[#E8E8E6] text-[#37352F]/60 hover:text-[#37352F] rounded transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <span className="text-base shrink-0">{row.icon || '📄'}</span>
                <span
                  onClick={() => onSelectPage(row.id)}
                  className="font-bold text-xs text-[#37352F] hover:underline cursor-pointer truncate"
                >
                  {row.title}
                </span>
              </div>

              {/* Badges and parameters */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="flex items-center gap-1.5">
                  {propertyConfigs.map((col) => {
                    const val = row.properties[col.name];
                    if (!val) return null;
                    return (
                      <span
                        key={col.id}
                        className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold border ${
                          col.type === 'select'
                            ? val === 'Done' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                            : col.type === 'checkbox'
                            ? 'bg-purple-50 text-purple-700 border-purple-100'
                            : 'bg-[#F1F1EF] text-[#37352F]/70 border-transparent'
                        }`}
                      >
                        {col.name}: {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : val}
                      </span>
                    );
                  })}
                </div>

                <button
                  onClick={() => {
                    if (confirm(`Delete list element "${row.title}"?`)) onDeletePage(row.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#E8E8E6] hover:text-rose-600 rounded text-[#37352F]/40 cursor-pointer transition-opacity animate-[fadeIn_0.1s_ease-out]"
                  title="Delete row"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="py-12 text-center text-[#37352F]/40 italic">
              This list database has no elements. Click "Add Row Page" to populate!
            </div>
          )}
        </div>
      )}

      {/* Guide footer info */}
      <div className="p-3 bg-[#F9F9F8] text-[#37352F]/50 text-[10px] flex items-center gap-1.5 border-t border-[#E8E8E6]">
        <HelpCircle className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
        <span>Layout customizers and multiple views synchronized. Open any row details directly to map live transitive graph connections inside the editor!</span>
      </div>

    </div>
  );
}
