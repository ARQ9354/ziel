import { useState } from 'react';
import { DocumentPage, DatabasePropertyConfig, PropertyType } from '../types';
import { Plus, Settings, ChevronRight, HelpCircle, Calendar, Hash, Type as TextIcon, CheckSquare, Trash2, List, Columns, Table } from 'lucide-react';

interface DatabaseViewProps {
  databasePage: DocumentPage;
  pages: DocumentPage[];
  onCreateRow: (databaseId: string, initialProperties?: Record<string, any>) => void;
  onUpdateRowProperty: (rowId: string, propertyName: string, value: any) => void;
  onAddColumn: (databaseId: string, name: string, type: PropertyType, options: string[]) => void;
  onDeleteColumn: (databaseId: string, columnId: string) => void;
  onSelectPage: (id: string) => void;
  onDeletePage: (id: string) => void;
}

export default function DatabaseView({
  databasePage,
  pages,
  onCreateRow,
  onUpdateRowProperty,
  onAddColumn,
  onDeleteColumn,
  onSelectPage,
  onDeletePage,
}: DatabaseViewProps) {
  // Fetch rows belonging to this database
  const rows = pages.filter((p) => p.databaseId === databasePage.id);
  const propertyConfigs = databasePage.propertyConfigs || [];

  // Multiple Notion Layouts
  const [layoutMode, setLayoutMode] = useState<'table' | 'kanban' | 'list'>('table');

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
  const kanbanColumns = activeGroupCfg ? ['', ...(activeGroupCfg.options || [])] : ['No select column'];

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
              <h3 className="font-bold text-[#37352F] text-sm">{databasePage.title}</h3>
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
            <span>Customize Properties</span>
          </button>

          <button
            onClick={() => onCreateRow(databasePage.id)}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#37352F] hover:bg-[#4B4841] text-white text-xs rounded-lg font-bold cursor-pointer transition-colors shadow-2xs active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Row Page</span>
          </button>
        </div>
      </div>

      {/* Add Column Popup Configurator */}
      {showAddCol && (
        <div className="p-4 bg-[#F7F7F5] border-b border-[#E8E8E6] grid grid-cols-1 md:grid-cols-4 gap-3 items-end shadow-2xs">
          <div>
            <label className="block text-[10px] text-[#37352F]/60 font-semibold mb-1 uppercase tracking-wider">Property Name</label>
            <input
              type="text"
              placeholder="e.g. Assignee, Scope..."
              value={colName}
              onChange={(e) => setColName(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#E8E8E6] rounded text-[#37352F] focus:outline-none focus:border-[#37352F]"
            />
          </div>

          <div>
            <label className="block text-[10px] text-[#37352F]/60 font-semibold mb-1 uppercase tracking-wider">Type</label>
            <select
              value={colType}
              onChange={(e) => setColType(e.target.value as PropertyType)}
              className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#E8E8E6] rounded text-[#37352F] focus:outline-none focus:border-[#37352F] cursor-pointer"
            >
              <option value="text">Text Segment</option>
              <option value="select">Select (Dropdown)</option>
              <option value="date">Calendar Date</option>
              <option value="checkbox">Checkbox Status</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-[#37352F]/60 font-semibold mb-1 uppercase tracking-wider">
              Options (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Low, Medium, High"
              value={colOptionsStr}
              onChange={(e) => setColOptionsStr(e.target.value)}
              disabled={colType !== 'select'}
              className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#E8E8E6] rounded text-[#37352F] disabled:opacity-40 focus:outline-none focus:border-[#37352F]"
            />
          </div>

          <div className="flex gap-2">
            <button
               onClick={handleCreateColumn}
               className="flex-1 text-xs py-1.5 bg-[#37352F] hover:bg-[#4B4841] rounded text-white font-bold cursor-pointer transition-colors"
            >
              Add Property
            </button>
            <button
              onClick={() => setShowAddCol(false)}
              className="px-2.5 py-1.5 bg-white border border-[#E8E8E6] hover:bg-[#F1F1EF] rounded text-[#37352F]/70 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* LAYOUT 1: TABLE VIEW */}
      {layoutMode === 'table' && (
        <div className="overflow-x-auto flex-1 bg-white">
          <table className="w-full border-collapse text-left min-w-[650px]">
            <thead>
              <tr className="border-b border-[#E8E8E6] bg-[#F7F7F5] text-[10px] text-[#37352F]/50 font-bold tracking-widest select-none uppercase">
                <th className="py-3 px-4 w-[280px]">Row Page Title</th>
                {propertyConfigs.map((col) => (
                  <th key={col.id} className="py-3 px-4 min-w-[140px]">
                    <div className="flex items-center justify-between group">
                      <span className="flex items-center gap-1.5">
                        {getPropIcon(col.type)}
                        {col.name}
                      </span>
                      <button
                        onClick={() => onDeleteColumn(databasePage.id, col.id)}
                        className="p-0.5 text-rose-600 hover:bg-rose-50 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Delete property column"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  </th>
                ))}
                <th className="py-3 px-4 w-[80px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E6] text-xs">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-[#F7F7F5]/60 transition-colors group">
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectPage(row.id)}
                        className="p-1 hover:bg-[#E8E8E6] text-[#37352F]/60 hover:text-[#37352F] rounded transition-colors"
                        title="Open page details editor"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      <span className="text-sm shrink-0">{row.icon || '📄'}</span>
                      <input
                        type="text"
                        value={row.title}
                        onChange={(e) => onUpdateRowProperty(row.id, '_title', e.target.value)}
                        className="bg-transparent border border-transparent hover:border-[#E8E8E6] focus:border-[#37352F] focus:bg-white px-1.5 py-1 rounded text-[#37352F] font-bold truncate outline-none transition-all w-full"
                      />
                    </div>
                  </td>
                  {propertyConfigs.map((col) => {
                    const val = row.properties[col.name];
                    return (
                      <td key={col.id} className="py-2 px-4">
                        {col.type === 'text' && (
                          <input
                            type="text"
                            value={val || ''}
                            onChange={(e) => onUpdateRowProperty(row.id, col.name, e.target.value)}
                            placeholder="Empty cell..."
                            className="bg-transparent border border-transparent hover:border-[#E8E8E6]/80 focus:border-[#37352F] focus:bg-white px-2 py-1 rounded text-[#37352F] outline-none w-full transition-all"
                          />
                        )}
                        {col.type === 'checkbox' && (
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={!!val}
                              onChange={(e) => onUpdateRowProperty(row.id, col.name, e.target.checked)}
                              className="bg-white border-[#E8E8E6] rounded text-[#37352F] focus:ring-0 cursor-pointer h-4 w-4"
                            />
                          </div>
                        )}
                        {col.type === 'date' && (
                          <input
                            type="date"
                            value={val || ''}
                            onChange={(e) => onUpdateRowProperty(row.id, col.name, e.target.value)}
                            className="bg-transparent select-text border border-transparent hover:border-[#E8E8E6] text-[#37352F] text-xs rounded px-1.5 py-0.5 outline-none cursor-pointer"
                          />
                        )}
                        {col.type === 'select' && (
                          <select
                            value={val || ''}
                            onChange={(e) => onUpdateRowProperty(row.id, col.name, e.target.value)}
                            className="bg-transparent cursor-pointer border border-transparent hover:border-[#E8E8E6] text-[#37352F] text-xs rounded px-1.5 py-0.5 focus:bg-white outline-none w-full"
                          >
                            <option value="">—</option>
                            {col.options?.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-2 px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        if (confirm(`Delete row "${row.title || 'Untitled'}"?`)) {
                          onDeletePage(row.id);
                        }
                      }}
                      className="p-1 hover:bg-[#E8E8E6] hover:text-rose-600 text-[#37352F]/40 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={propertyConfigs.length + 2}
                    className="py-12 text-center text-[#37352F]/40 italic"
                  >
                    This database has no pages. Click "Add Row Page" to populate rows!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* LAYOUT 2: KANBAN BOARD VIEW */}
      {layoutMode === 'kanban' && (
        <div className="bg-[#FAF9F6] p-4 overflow-x-auto min-h-[450px]">
          {!activeGroupCfg ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-xs p-5 bg-white border border-dashed border-[#E8E8E6] rounded-xl">
              <Columns className="h-8 w-8 text-[#37352F]/20 mb-2" />
              <span className="font-bold text-[#37352F]">No 'Select' column found.</span>
              <p className="text-[#37352F]/50 max-w-[340px] mt-1">
                To group keys on a Kanban board, please click <strong>Customize Properties</strong> above and add a <strong>Select (Dropdown)</strong> column type first (e.g. "Status" or "Priority")!
              </p>
            </div>
          ) : (
            <div className="flex gap-4 items-start pb-4 min-w-[700px]">
              {kanbanColumns.map((colOption) => {
                const columnRows = getRowsForKanbanColumn(colOption);
                const colTitle = colOption || 'Unassigned / No Option';
                return (
                  <div key={colTitle} className="w-80 flex-shrink-0 bg-[#F1F1EF]/40 border border-[#E8E8E6] rounded-xl p-3 flex flex-col gap-3">
                    
                    {/* Column Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wider ${
                          colOption === 'Idea' ? 'bg-[#EBF5FF] text-blue-700' :
                          colOption === 'In Progress' ? 'bg-[#FEF3C7] text-amber-800' :
                          colOption === 'Done' ? 'bg-[#ECFDF5] text-emerald-700' :
                          colOption ? 'bg-[#F3F4F6] text-[#37352F]/80' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {colTitle}
                        </span>
                        <span className="text-[10px] font-mono text-[#37352F]/40 font-bold">({columnRows.length})</span>
                      </div>
                    </div>

                    {/* Cards Container */}
                    <div className="flex flex-col gap-2 min-h-[50px]">
                      {columnRows.map((row) => (
                        <div key={row.id} className="bg-white border border-[#E8E8E6] rounded-lg p-3 hover:border-[#37352F]/50 transition-all shadow-2xs group flex flex-col gap-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="text-base shrink-0">{row.icon || '📄'}</span>
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
                              className="text-rose-600 hover:text-rose-800 text-[10px] font-semibold flex items-center gap-0.5 mt-1"
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
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* LAYOUT 3: VERTICAL LIST VIEW */}
      {layoutMode === 'list' && (
        <div className="flex flex-col border-t border-[#E8E8E6] divide-y divide-[#E8E8E6] bg-white">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center justify-between p-3.5 hover:bg-[#F7F7F5]/70 transition-colors group">
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
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#E8E8E6] hover:text-rose-600 rounded text-[#37352F]/40 cursor-pointer transition-opacity"
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
