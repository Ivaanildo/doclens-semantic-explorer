
export type RelationType = 'extends' | 'depends_on' | 'contradicts' | 'related' | 'application';

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  attachments?: {
    type: 'image';
    data: string; // Base64
  }[];
  metadata?: {
    pageNumber?: number;
    originalPrompt?: string; 
    regionCoordinates?: Rect; 
    contextPayload?: ChatContextPayload;
    mindmapMarkdown?: string;
    citations?: Citation[];
    relatedNodes?: string[];
    isComparison?: boolean;
    relationScore?: number;
    relationType?: RelationType;
  };
  isError?: boolean;
}

export interface Citation {
    page: number;
    snippet: string;
    confidence: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  fileName?: string; 
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetailedNodeInfo {
    label: string;
    definition: string;
    examples: string[];
    type: 'concept' | 'example' | 'application';
    confidence: number;
    evidence: Citation[];
    relationships: { target: string, type: RelationType, score: number }[];
}

export interface GraphInteraction {
  type: 'click' | 'dblclick' | 'contextmenu';
  nodeId: string;
  label: string;
  path?: string[];
}

export type GraphMode = 'auto' | 'comparative';

export interface SemanticGraphData {
  nodes: SemanticNode[];
}

export interface SemanticNode {
  id: string;
  label: string;
  type: 'main' | 'example' | 'supporting';
}

// Added MindMapNode interface to fix the module export error in MindMapViewer.tsx
export interface MindMapNode {
  id: string;
  label: string;
  description?: string;
  x: number;
  y: number;
  depth: number;
  parentId?: string;
  children: string[];
  isExpanded?: boolean;
}

export interface GraphGenerationConfig {
  mode: GraphMode;
  maxDepth: number;
  rootConcept?: string;
  comparisonTargets?: string[];
}

export interface ChatContextPayload {
  selectedConcept: string;
  contextType: ContextType;
  nodeHierarchy: string;
  relatedConcepts?: string[];
  evidence?: Citation[];
}

export type ContextType = "strict" | "liberal" | "expansive";

export interface Command {
    id: string;
    label: string;
    prompt: string;
    icon: string;
}

declare global {
  interface Window {
    pdfjsLib: any;
  }
}
