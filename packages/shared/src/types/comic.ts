export type ComicStatus = 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived';
export type ComicSize = 'small' | 'medium' | 'large';
export type Genre = 
  | 'adventure' 
  | 'fantasy' 
  | 'scifi' 
  | 'horror' 
  | 'romance' 
  | 'mystery' 
  | 'action' 
  | 'cyberpunk'
  | 'comedy'
  | 'drama'
  | 'thriller';

export type EndingType = 'good' | 'bad' | 'neutral' | 'secret';
export type DialogueType = 'speech' | 'thought' | 'narration' | 'sfx';

export interface Comic {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  authorId: string;
  authorName: string;
  genres: Genre[];
  tags: string[];
  status: ComicStatus;
  size: ComicSize;
  
  startPageId: string;
  totalPages: number;
  totalEndings: number;
  
  rating: number;
  readCount: number;
  estimatedMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComicPage {
  id: string;
  comicId: string;
  pageNumber: number;
  title?: string;
  
  panels: Panel[];
  choices: Choice[];
  
  isEnding: boolean;
  endingType?: EndingType;
  endingTitle?: string;
  
  conditions?: Condition[];
}

export interface Panel {
  id: string;
  order: number;
  imageUrl: string;
  
  layout: PanelLayout;
  
  dialogues: Dialogue[];
  
  effects?: PanelEffect[];
}

export interface PanelLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex?: number;
}

export interface Dialogue {
  id: string;
  type: DialogueType;
  text: string;
  character?: string;
  
  position: {
    x: number;
    y: number;
  };
  
  style?: DialogueStyle;
}

export interface DialogueStyle {
  bubbleType?: 'normal' | 'scream' | 'whisper' | 'thought' | 'narration';
  fontSize?: 'small' | 'normal' | 'large';
  fontStyle?: 'normal' | 'italic' | 'bold';
}

export interface Choice {
  id: string;
  choiceId?: string;
  text: string;
  targetPageId: string;
  
  condition?: Condition;
  consequences?: Consequence[];
  
  icon?: string;
  style?: 'normal' | 'danger' | 'success' | 'mysterious';
  position?: {
    x: number;
    y: number;
    w?: number;
    h?: number;
  };
}

export interface Condition {
  type: 'variable' | 'visited' | 'choice_made' | 'item';
  key: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=';
  value: string | number | boolean;
}

export interface Consequence {
  type: 'set_variable' | 'add_item' | 'remove_item' | 'unlock_achievement';
  key: string;
  value?: string | number | boolean;
}

export interface PanelEffect {
  type: 'shake' | 'fade' | 'zoom' | 'flash' | 'blur';
  duration?: number;
  intensity?: number;
}

export interface ReadingProgress {
  id: string;
  odyserId: string;
  comicId: string;
  
  currentPageId: string;
  visitedPages: string[];
  choicesHistory: ChoiceRecord[];
  
  variables: Record<string, string | number | boolean>;
  inventory: string[];
  
  unlockedEndings: string[];
  
  startedAt: Date;
  updatedAt: Date;
  totalTimeSeconds: number;
}

export interface ChoiceRecord {
  pageId: string;
  choiceId: string;
  timestamp: Date;
}

export interface ComicPreview {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  authorName: string;
  genres: Genre[];
  size: ComicSize;
  rating: number;
  readCount: number;
  estimatedMinutes: number;
}

export interface ComicData {
  comic: Comic;
  pages: ComicPage[];
}
