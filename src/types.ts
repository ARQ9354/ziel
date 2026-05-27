export type PropertyType = 'text' | 'select' | 'date' | 'checkbox';

export interface DatabasePropertyConfig {
  id: string;
  name: string;
  type: PropertyType;
  options?: string[]; // Used for 'select'
}

export interface PageComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface DocumentPage {
  id: string;
  title: string;
  icon: string; // Emoji
  content: string; // Markdown document content
  createdAt: string;
  updatedAt: string;
  isDatabase: boolean; // True if this functions as a database container
  databaseId?: string | null; // If this page is a row/entry, which database does it belong to?
  parentId: string | null; // For hierarchical page support
  properties: Record<string, any>; // Key-value for database columns
  propertyConfigs?: DatabasePropertyConfig[]; // Schema if isDatabase is true
  coverImage?: string; // Beautiful cover banner background
  comments?: PageComment[]; // Notion-like page discussion/comments
}

export interface LinkConnection {
  fromId: string;
  toId: string;
}

export interface VisualNode {
  id: string;
  label: string;
  icon: string;
  isDatabase: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface VisualEdge {
  id: string;
  source: string;
  target: string;
  isTransitive: boolean;
  path: string[]; // Node IDs representing the path of transitiveness
}

export type TriggerType = 'on_property_change' | 'on_page_created' | 'on_link_added';
export type ActionType = 'auto_link' | 'ai_generate_tags' | 'ai_summarize' | 'set_property';

export interface AutomationRule {
  id: string;
  name: string;
  triggerType: TriggerType;
  triggerConfig: {
    propertyName?: string;
    propertyValue?: any;
    targetPageId?: string;
  };
  actionType: ActionType;
  actionConfig: {
    targetPageId?: string;
    propertyName?: string;
    propertyValue?: any;
    instruction?: string;
  };
  isActive: boolean;
}

export interface AutomationLog {
  id: string;
  ruleName: string;
  timestamp: string;
  status: 'success' | 'error' | 'running';
  details: string;
}

export interface WorkspaceState {
  pages: DocumentPage[];
  links: LinkConnection[];
  automations: AutomationRule[];
  logs: AutomationLog[];
}
