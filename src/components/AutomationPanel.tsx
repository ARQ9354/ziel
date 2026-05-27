import { useState } from 'react';
import { AutomationRule, AutomationLog, DocumentPage, TriggerType, ActionType } from '../types';
import { ToggleLeft, ToggleRight, Play, Wrench, Shield, Plus, Clock, FileWarning, Eye, Activity, Trash } from 'lucide-react';

interface AutomationPanelProps {
  automations: AutomationRule[];
  logs: AutomationLog[];
  pages: DocumentPage[];
  onAddAutomation: (rule: Omit<AutomationRule, 'id'>) => void;
  onToggleAutomation: (id: string) => void;
  onDeleteAutomation: (id: string) => void;
  onClearLogs: () => void;
}

export default function AutomationPanel({
  automations,
  logs,
  pages,
  onAddAutomation,
  onToggleAutomation,
  onDeleteAutomation,
  onClearLogs,
}: AutomationPanelProps) {
  // Local state for builder
  const [showBuilder, setShowBuilder] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [triggerType, setTriggerType] = useState<TriggerType>('on_property_change');
  const [triggerProperty, setTriggerProperty] = useState('Status');
  const [triggerVal, setTriggerVal] = useState('Done');
  
  const [actionType, setActionType] = useState<ActionType>('auto_link');
  const [actionPageId, setActionPageId] = useState('');
  const [actionPropName, setActionPropName] = useState('Needs Review');
  const [actionPropVal, setActionPropVal] = useState('true');

  const handleBuildRule = () => {
    if (!ruleName.trim()) return;

    const newRule: Omit<AutomationRule, 'id'> = {
      name: ruleName.trim(),
      triggerType,
      triggerConfig: {
        propertyName: triggerType === 'on_property_change' ? triggerProperty : undefined,
        propertyValue: triggerType === 'on_property_change' ? triggerVal : undefined,
      },
      actionType,
      actionConfig: {
        targetPageId: actionType === 'auto_link' ? actionPageId : undefined,
        propertyName: actionType === 'set_property' ? actionPropName : undefined,
        propertyValue: actionType === 'set_property' ? actionPropVal : undefined,
      },
      isActive: true,
    };

    onAddAutomation(newRule);
    setRuleName('');
    setShowBuilder(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Rule configurator panel */}
      <div className="lg:col-span-2 flex flex-col gap-5">
        
        {/* Title Card */}
        <div className="bg-white border border-[#E8E8E6] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-[#F1F1EF] border border-[#E8E8E6] flex items-center justify-center">
                <Wrench className="h-4.5 w-4.5 text-[#37352F]" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-[#37352F] tracking-tight uppercase">Active Automation Triggers</h2>
                <p className="text-[#37352F]/50 text-[11px] font-semibold">Define conditions to automate linking, tagging, or property mapping inside the workspace.</p>
              </div>
            </div>

            <button
              onClick={() => setShowBuilder(!showBuilder)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#37352F] hover:bg-[#4B4841] text-white rounded-lg font-bold cursor-pointer transition-all active:scale-95 shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Rule</span>
            </button>
          </div>

          {/* Builder Popup Container */}
          {showBuilder && (
            <div className="mt-4 p-4 bg-[#F7F7F5] border border-[#E8E8E6] rounded-lg flex flex-col gap-4 shadow-2xs">
              <div className="font-bold text-[10px] text-[#37352F]/40 border-b border-[#E8E8E6] pb-1.5 tracking-widest uppercase">
                NEW WORKSPACE RULE BUILDER
              </div>

              <div>
                <label className="block text-[10px] text-[#37352F]/60 font-semibold mb-1 uppercase tracking-wider">Rule Name</label>
                <input
                  type="text"
                  placeholder="e.g. When Done -> Link to Vision"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#E8E8E6] rounded text-[#37352F] placeholder:text-[#37352F]/30 focus:outline-none focus:border-[#37352F]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Trigger Config */}
                <div className="p-3 bg-white border border-[#E8E8E6] rounded-lg">
                  <span className="block text-[10px] text-[#37352F]/40 font-bold mb-2 uppercase tracking-wide">1. Trigger Condition</span>
                  
                  <select
                    value={triggerType}
                    onChange={(e) => setTriggerType(e.target.value as TriggerType)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#E8E8E6] rounded text-[#37352F] outline-none mb-3 cursor-pointer focus:border-[#37352F]"
                  >
                    <option value="on_property_change">On Cell Property Update</option>
                    <option value="on_page_created">On Page Created</option>
                  </select>

                  {triggerType === 'on_property_change' && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Column (e.g. Status)"
                        value={triggerProperty}
                        onChange={(e) => setTriggerProperty(e.target.value)}
                        className="w-1/2 text-xs px-2 py-1 bg-[#F7F7F5] border border-[#E8E8E6] rounded text-[#37352F] focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. Done)"
                        value={triggerVal}
                        onChange={(e) => setTriggerVal(e.target.value)}
                        className="w-1/2 text-xs px-2 py-1 bg-[#F7F7F5] border border-[#E8E8E6] rounded text-[#37352F] focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Action logic */}
                <div className="p-3 bg-white border border-[#E8E8E6] rounded-lg">
                  <span className="block text-[10px] text-purple-700 font-bold mb-2 uppercase tracking-wide">2. Action Executable</span>

                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value as ActionType)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#E8E8E6] rounded text-[#37352F] outline-none mb-3 cursor-pointer focus:border-[#37352F]"
                  >
                    <option value="auto_link">Auto Link to Target Page</option>
                    <option value="ai_summarize">Generate AI Summary Text</option>
                  </select>

                  {actionType === 'auto_link' && (
                    <select
                      value={actionPageId}
                      onChange={(e) => setActionPageId(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-[#E8E8E6] rounded text-[#37352F] outline-none cursor-pointer focus:border-[#37352F]"
                    >
                      <option value="">Select target document...</option>
                      {pages.filter(p => !p.isDatabase && p.databaseId === undefined).map(p => (
                        <option key={p.id} value={p.id}>{p.icon} {p.title}</option>
                      ))}
                    </select>
                  )}

                  {actionType === 'set_property' && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Column Name"
                        value={actionPropName}
                        onChange={(e) => setActionPropName(e.target.value)}
                        className="w-1/2 text-xs px-2 py-1 bg-white border border-[#E8E8E6] rounded"
                      />
                      <input
                        type="text"
                        placeholder="New Value"
                        value={actionPropVal}
                        onChange={(e) => setActionPropVal(e.target.value)}
                        className="w-1/2 text-xs px-2 py-1 bg-white border border-[#E8E8E6] rounded"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-2">
                <button
                  onClick={handleBuildRule}
                  disabled={!ruleName || (actionType === 'auto_link' && !actionPageId)}
                  className="px-4 py-1.5 bg-[#37352F] hover:bg-[#4B4841] rounded-lg text-xs font-bold text-white disabled:opacity-40 cursor-pointer shadow-2xs"
                >
                  Activate Configured Automation
                </button>
                <button
                  onClick={() => setShowBuilder(false)}
                  className="px-3 py-1.5 bg-white border border-[#E8E8E6] hover:bg-[#F1F1EF] rounded-md text-xs text-[#37352F]/70 cursor-pointer font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Rules list */}
          <div className="flex flex-col gap-2.5 mt-4">
            {automations.map((rule) => (
              <div 
                key={rule.id}
                className="p-4 bg-[#F2F2F0] border border-[#E8E8E6] rounded-xl flex items-center justify-between group hover:border-[#37352F]/40 transition-all duration-200"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <Play className={`h-4.5 w-4.5 mt-0.5 ${rule.isActive ? 'text-[#37352F]' : 'text-[#37352F]/30'}`} />
                  <div>
                    <h4 className="font-bold text-sm text-[#37352F]">{rule.name}</h4>
                    
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-[#37352F]/60">
                      <span className="bg-white border border-[#E8E8E6] px-1.5 py-0.5 rounded text-[#37352F]/80">
                        {rule.triggerType === 'on_property_change' 
                          ? `When cell "${rule.triggerConfig.propertyName || 'Tag'}" updates to "${rule.triggerConfig.propertyValue || ''}"`
                          : 'When new page is created'}
                      </span>
                      <span className="text-[9px]">➔</span>
                      <span className="bg-white border border-[#E8E8E6] px-1.5 py-0.5 rounded text-purple-700 font-bold">
                        {rule.actionType === 'auto_link'
                          ? `Auto-link directly to: "${pages.find(p => p.id === rule.actionConfig.targetPageId)?.title || rule.actionConfig.targetPageId}"`
                          : rule.actionType === 'ai_summarize' ? 'Generate AI executive summary' : 'Update property cell'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onToggleAutomation(rule.id)}
                    className="text-[#37352F]/60 hover:text-[#37352F] cursor-pointer"
                    title={rule.isActive ? "Deactivate rule" : "Activate rule"}
                  >
                    {rule.isActive ? (
                      <ToggleRight className="h-6 w-6 text-indigo-600" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-[#37352F]/25" />
                    )}
                  </button>

                  <button
                    onClick={() => onDeleteAutomation(rule.id)}
                    className="p-1 hover:bg-[#E8E8E6] hover:text-rose-600 rounded text-[#37352F]/30 cursor-pointer"
                    title="Delete automation"
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Real-time Diagnostics Log */}
      <div className="bg-white border border-[#E8E8E6] rounded-xl p-5 shadow-sm flex flex-col h-[550px]">
        <div className="flex items-center justify-between border-b border-[#E8E8E6] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-purple-600 animate-pulse" />
            <h3 className="font-bold text-[#37352F] text-xs tracking-tight uppercase">Runtime Diagnostic Console</h3>
          </div>
          <button
            onClick={onClearLogs}
            className="text-[10px] text-[#37352F]/40 hover:text-rose-600 cursor-pointer uppercase font-bold tracking-wider"
          >
            Clear logs
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 font-mono text-[10px] text-[#37352F] pr-1.5 scrollbar-thin">
          {logs.map((log) => (
            <div 
              key={log.id}
              className={`p-3 border rounded-lg bg-[#F7F7F5] ${
                log.status === 'success' ? 'border-[#E8E8E6]' : 'border-rose-100 bg-rose-50/30'
              }`}
            >
              <div className="flex items-center justify-between mb-1 text-[9px] text-[#37352F]/40">
                <span className="text-purple-700 font-bold">{log.ruleName}</span>
                <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="text-[#37352F]/80 leading-relaxed">{log.details}</p>
            </div>
          ))}

          {logs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-[#37352F]/30 py-12 text-center text-xs">
              <Clock className="h-8 w-8 text-[#37352F]/20 mb-2" />
              <span>Diagnostic lines will record here once automated rules trigger.</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
