import { DocumentPage, LinkConnection, AutomationRule, WorkspaceState } from '../types';

export const INITIAL_PAGES: DocumentPage[] = [
  {
    id: 'vision-aim',
    title: 'Vision & North Star Goal',
    icon: '🎯',
    content: `# Vision & North Star Goal\n\nWelcome to **GraphNotion Workspace**, where documents are linked as a self-organizing knowledge graph.\n\n### The Core Philosophy\nRather than storing files in isolated, nested folders, everything in this workspace is styled like a web of concepts. \n\n### Transitive Closure Linking\nThis workspace automatically maps indirect connections. For illustration:\n- This page (**Vision**) is connected directly to **Product Specification**.\n- **Product Specification** is connected directly to **Frontend Architecture**.\n- Consequently, **Vision** is *automatically* mapped to **Frontend Architecture**!\n\nUse the dynamic **Knowledge Graph Visualizer** below to view these connections in real time, or use **Copilot AI** to ask about semantic connections.`,
    createdAt: '2026-05-27T08:00:00Z',
    updatedAt: '2026-05-27T08:00:00Z',
    isDatabase: false,
    parentId: null,
    properties: {
      'Status': 'Idea',
      'Priority': 'High',
      'Dept': 'Leadership'
    }
  },
  {
    id: 'product-spec',
    title: 'AuraGraph Product Specs',
    icon: '📊',
    content: `# AuraGraph Product Specifications\n\nDetailed specifications for the transitive knowledge graph workspace.\n\n### Key Features\n1. **Notion-Like Workspaces**: Databases with rich columns, customized properties, and responsive pages.\n2. **Dynamic Automation Rules**: Set triggers to execute actions when variables change.\n3. **Copilot AI**: Directly integrated with Gemini to autocomplete, summarize, and suggest graph links.\n4. **Transitive Link Closure**: The engine computes transitivity dynamically, enabling seamless path routing.`,
    createdAt: '2026-05-27T08:05:00Z',
    updatedAt: '2026-05-27T08:05:00Z',
    isDatabase: false,
    parentId: null,
    properties: {
      'Status': 'In Progress',
      'Priority': 'High',
      'Dept': 'Product Management'
    }
  },
  {
    id: 'frontend-arch',
    title: 'Frontend Architecture & SVG Engine',
    icon: '⚙️',
    content: `# Frontend Architecture & SVG Engine\n\nDetailed view of the rendering layer of our application graph.\n\n### Technical Stack\n- **Vite & React 19**: Responsive layout rendering\n- **Tailwind CSS**: Strict custom-crafted styling elements\n- **SVG Physics Canvas**: Built-in force-directed simulation providing smooth visual node movements\n- **TypeScript**: Complete compile-time type safety\n\nThis page is linked from **AuraGraph Product Specs**, which is linked from the **Vision** page. Use the visualizer to explore this relationship.`,
    createdAt: '2026-05-27T08:10:00Z',
    updatedAt: '2026-05-27T08:10:00Z',
    isDatabase: false,
    parentId: null,
    properties: {
      'Status': 'In Progress',
      'Priority': 'Medium',
      'Dept': 'Engineering'
    }
  },
  {
    id: 'task-db',
    title: 'Product Roadmap Database',
    icon: '🗃️',
    content: `# Product Roadmap Database\n\nThis is a Notion-like dynamic database. You can add, edit, and filter rows. Each row is itself a fully functional document page that supports graph relationship inheritance!\n\nUse the grid below to customize column property values, or run custom automated actions.`,
    createdAt: '2026-05-27T08:15:00Z',
    updatedAt: '2026-05-27T08:15:00Z',
    parentId: null,
    isDatabase: true,
    properties: {},
    propertyConfigs: [
      { id: 'prop-status', name: 'Status', type: 'select', options: ['Idea', 'In Progress', 'Done', 'Reference'] },
      { id: 'prop-priority', name: 'Priority', type: 'select', options: ['High', 'Medium', 'Low'] },
      { id: 'prop-owner', name: 'Assignee', type: 'text' },
      { id: 'prop-review', name: 'Needs Review', type: 'checkbox' }
    ]
  },
  {
    id: 'row-task-1',
    title: 'Design high-contrast graph visualizer',
    icon: '🎨',
    content: `# Design high-contrast graph visualizer\n\nThis task covers creating an elegant interactive knowledge graph.\n\n- Needs node highlighting on hover.\n- Toggle switches for displaying transitive links.\n- Clicking a node instantly navigates the editor to that page.\n- Use SVG to allow fluid physics force layouts.`,
    createdAt: '2026-05-27T08:20:00Z',
    updatedAt: '2026-05-27T08:20:00Z',
    isDatabase: false,
    databaseId: 'task-db',
    parentId: 'task-db',
    properties: {
      'Status': 'Done',
      'Priority': 'High',
      'Assignee': 'Sarah Connor',
      'Needs Review': true
    }
  },
  {
    id: 'row-task-2',
    title: 'Implement server-side Gemini integration',
    icon: '🤖',
    content: `# Implement server-side Gemini integration\n\nThis task represents building the AI Copilot API endpoints on our custom Express server.\n\n- Proxy requests securely, hiding key from browser.\n- Add support for link recommendation by analyzing context.\n- Leverage 'gemini-3.5-flash' for lighting speed.`,
    createdAt: '2026-05-27T08:25:00Z',
    updatedAt: '2026-05-27T08:25:00Z',
    isDatabase: false,
    databaseId: 'task-db',
    parentId: 'task-db',
    properties: {
      'Status': 'In Progress',
      'Priority': 'High',
      'Assignee': 'Tony Stark',
      'Needs Review': false
    }
  },
  {
    id: 'row-task-3',
    title: 'Create automation rule compiler',
    icon: '⚡',
    content: `# Create automation rule compiler\n\nThis task targets the automation engine in our knowledge database.\n\n- Listen to trigger changes (like status updates).\n- Execute actions (e.g. auto link, AI summaries).\n- Write to runtime logs for diagnostics.`,
    createdAt: '2026-05-27T08:30:00Z',
    updatedAt: '2026-05-27T08:30:00Z',
    isDatabase: false,
    databaseId: 'task-db',
    parentId: 'task-db',
    properties: {
      'Status': 'Idea',
      'Priority': 'Low',
      'Assignee': 'Bruce Banner',
      'Needs Review': false
    }
  }
];

export const INITIAL_LINKS: LinkConnection[] = [
  // A -> B
  { fromId: 'vision-aim', toId: 'product-spec' },
  // B -> C
  { fromId: 'product-spec', toId: 'frontend-arch' },
  // Additional workspace links
  { fromId: 'vision-aim', toId: 'task-db' },
  { fromId: 'product-spec', toId: 'row-task-2' },
  { fromId: 'frontend-arch', toId: 'row-task-1' }
];

export const INITIAL_AUTOMATIONS: AutomationRule[] = [
  {
    id: 'auto-rule-1',
    name: 'Auto-link completed tasks to vision',
    triggerType: 'on_property_change',
    triggerConfig: {
      propertyName: 'Status',
      propertyValue: 'Done'
    },
    actionType: 'auto_link',
    actionConfig: {
      targetPageId: 'vision-aim'
    },
    isActive: true
  },
  {
    id: 'auto-rule-2',
    name: 'Smart AI summary on creation',
    triggerType: 'on_page_created',
    triggerConfig: {},
    actionType: 'ai_summarize',
    actionConfig: {
      instruction: "Summarize the newly added item to outline scope."
    },
    isActive: false
  }
];

export const INITIAL_W_STATE: WorkspaceState = {
  pages: INITIAL_PAGES,
  links: INITIAL_LINKS,
  automations: INITIAL_AUTOMATIONS,
  logs: [
    {
      id: 'log-1',
      ruleName: 'Auto-link completed tasks to vision',
      timestamp: '2026-05-27T08:42:00Z',
      status: 'success',
      details: 'Evaluated "Design high-contrast graph visualizer" property change (Status -> Done). Successfully created direct knowledge link to "Vision & North Star Goal".'
    }
  ]
};
