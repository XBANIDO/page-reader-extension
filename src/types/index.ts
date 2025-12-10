// Settings Types
export interface Settings {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  baseUrl: 'https://api.poe.com/v1',
  model: 'GPT-5.1',
};

// AI Config for request
export interface AIConfig {
  systemPrompt: string;
  outputLanguage: string;
  outputFormat: string;
  enableWebSearch: boolean;
  reasoningEffort: 'low' | 'medium' | 'high';
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  systemPrompt: '',
  outputLanguage: 'auto',
  outputFormat: 'markdown',
  enableWebSearch: false,
  reasoningEffort: 'medium',
};

// Video Generation Types
export type VideoModel = 'Veo-3.1' | 'Sora-2' | 'Kling-2.0' | 'Runway-Gen3';

export interface VideoModelConfig {
  name: VideoModel;
  displayName: string;
  maxDuration: number;
  minDuration: number;
  durationStep: number;
  aspectRatios: string[];
  defaultAspectRatio: string;
  supportsImageReference: boolean;
  supportsSoundGeneration: boolean;
  description: string;
}

export const VIDEO_MODELS: VideoModelConfig[] = [
  {
    name: 'Veo-3.1',
    displayName: 'Google Veo 3.1',
    maxDuration: 8,
    minDuration: 4,
    durationStep: 1,
    aspectRatios: ['9:16', '16:9', '1:1'],
    defaultAspectRatio: '9:16',
    supportsImageReference: true,
    supportsSoundGeneration: true,
    description: 'Google\'s latest video model with native audio generation',
  },
  {
    name: 'Sora-2',
    displayName: 'OpenAI Sora 2',
    maxDuration: 12,
    minDuration: 4,
    durationStep: 2,
    aspectRatios: ['9:16', '16:9', '1:1', '4:3'],
    defaultAspectRatio: '9:16',
    supportsImageReference: true,
    supportsSoundGeneration: false,
    description: 'OpenAI\'s advanced video generation model',
  },
  {
    name: 'Kling-2.0',
    displayName: 'Kuaishou Kling 2.0',
    maxDuration: 10,
    minDuration: 5,
    durationStep: 1,
    aspectRatios: ['9:16', '16:9', '1:1'],
    defaultAspectRatio: '9:16',
    supportsImageReference: true,
    supportsSoundGeneration: true,
    description: 'Kuaishou\'s powerful video model with audio',
  },
  {
    name: 'Runway-Gen3',
    displayName: 'Runway Gen-3 Alpha',
    maxDuration: 10,
    minDuration: 4,
    durationStep: 2,
    aspectRatios: ['16:9', '9:16', '1:1'],
    defaultAspectRatio: '16:9',
    supportsImageReference: true,
    supportsSoundGeneration: false,
    description: 'Runway\'s Gen-3 for cinematic video',
  },
];

export interface VideoConfig {
  model: VideoModel;
  duration: number;
  aspectRatio: string;
  useImageReference: boolean;
  referenceImageUrl: string;
  enableSound: boolean;
  brandName: string;
  brandUrl: string;
  targetLanguage: 'zh-CN' | 'en' | 'ja' | 'ko';
  videoStyle: 'product-demo' | 'lifestyle' | 'cinematic' | 'minimal';
  systemPrompt: string;
}

export const DEFAULT_VIDEO_CONFIG: VideoConfig = {
  model: 'Veo-3.1',
  duration: 6,
  aspectRatio: '9:16',
  useImageReference: false,
  referenceImageUrl: '',
  enableSound: true,
  brandName: 'XOOBAY',
  brandUrl: 'https://www.xoobay.com/',
  targetLanguage: 'zh-CN',
  videoStyle: 'product-demo',
  systemPrompt: '',
};

// Available Models - Latest 2025 Models from Leaderboard
// Reference: https://artificialanalysis.ai/leaderboards/models
export const AVAILABLE_MODELS = [
  // Top Tier Models
  'Gemini-3-Pro-Preview',
  'Claude-Opus-4.5',
  'GPT-5.1',
  'GPT-5',
  'Kimi-K2-Thinking',
  'GPT-5.1-Codex',
  'DeepSeek-V3.2',
  'o3',
  'Grok-4',
  
  // High Performance Models
  'GPT-5-mini',
  'Grok-4.1-Fast',
  'KAT-Coder-Pro-V1',
  'Claude-4.5-Sonnet',
  'Nova-2.0-Pro-Preview',
  'GPT-5.1-Codex-mini',
  'MiniMax-M2',
  'gpt-oss-120B',
  'Grok-4-Fast',
  
  // Gemini Series
  'Gemini-2.5-Pro',
  'Gemini-2.5-Flash',
  'Gemini-2.0-Flash',
  
  // DeepSeek Series
  'DeepSeek-V3.2-Speciale',
  'DeepSeek-V3.1-Terminus',
  'DeepSeek-R1',
  
  // Amazon Nova Series
  'Nova-2.0-Lite',
  'Nova-2.0-Omni',
  
  // Qwen Series
  'Qwen3-235B-A22B-2507',
  'Qwen-2.5-Max',
  
  // Other Models
  'Doubao-Seed-Code',
  'Grok-3-mini-Reasoning',
  'GLM-4.6',
  
  // Claude Series
  'Claude-3.7-Sonnet',
  'Claude-3.5-Sonnet',
  'Claude-3.5-Haiku',
  
  // Mistral Series
  'Mistral-Large-2',
  'Codestral',
];

// Page Content Types
export interface PageContent {
  url: string;
  title: string;
  text: string;
  html: string;
  selectedText: string | null;
  images: ImageInfo[];
  links: LinkInfo[];
  metadata: PageMetadata;
}

export interface ImageInfo {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface LinkInfo {
  href: string;
  text: string;
}

export interface PageMetadata {
  description: string | null;
  keywords: string | null;
  author: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
}

// Format Template
export interface FormatTemplate {
  type: 'json' | 'xml' | 'custom';
  content: string;
}

// Message Types
export type MessageType = 
  | 'GET_PAGE_CONTENT'
  | 'GET_SELECTED_TEXT'
  | 'GET_SETTINGS'
  | 'SAVE_SETTINGS'
  | 'AI_REQUEST'
  | 'VIDEO_REQUEST';

export interface ChromeMessage {
  type: MessageType;
  payload?: unknown;
}

// Video Generation Result
export interface VideoGenerationResult {
  type: 'video' | 'text';
  content: string;        // For text: the text content; For video: the video URL
  videoUrl?: string;      // Direct video URL if available
  thumbnailUrl?: string;  // Video thumbnail if available
  duration?: number;      // Video duration in seconds
  prompt?: string;        // The generated prompt that was used
}
