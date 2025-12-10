// Settings Types
export interface Settings {
  apiKey: string;
  baseUrl: string;
  model: string;
  // Video API settings (Together AI)
  videoApiKey: string;
  videoBaseUrl: string;
}

export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  baseUrl: 'https://api.poe.com/v1',
  model: 'GPT-5.1',
  // Together AI for video generation
  videoApiKey: '',
  videoBaseUrl: 'https://api.together.xyz/v1',
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

// Video Generation Types (Together AI Models)
export type VideoModel = 'wan-ai/wan2.1-t2v-14b' | 'wan-ai/wan2.1-i2v-14b-720p' | 'Luma/ray2';

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
  apiModelId: string; // Model ID for Together AI API
}

export const VIDEO_MODELS: VideoModelConfig[] = [
  {
    name: 'wan-ai/wan2.1-t2v-14b',
    displayName: 'Wan 2.1 Text-to-Video',
    maxDuration: 9,
    minDuration: 3,
    durationStep: 1,
    aspectRatios: ['16:9', '9:16', '1:1'],
    defaultAspectRatio: '16:9',
    supportsImageReference: false,
    supportsSoundGeneration: false,
    description: 'High-quality text-to-video generation',
    apiModelId: 'wan-ai/wan2.1-t2v-14b',
  },
  {
    name: 'wan-ai/wan2.1-i2v-14b-720p',
    displayName: 'Wan 2.1 Image-to-Video',
    maxDuration: 9,
    minDuration: 3,
    durationStep: 1,
    aspectRatios: ['16:9', '9:16', '1:1'],
    defaultAspectRatio: '16:9',
    supportsImageReference: true,
    supportsSoundGeneration: false,
    description: 'Convert images to animated video',
    apiModelId: 'wan-ai/wan2.1-i2v-14b-720p',
  },
  {
    name: 'Luma/ray2',
    displayName: 'Luma Ray 2',
    maxDuration: 9,
    minDuration: 5,
    durationStep: 4,
    aspectRatios: ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9', '9:21'],
    defaultAspectRatio: '16:9',
    supportsImageReference: true,
    supportsSoundGeneration: true,
    description: 'Luma\'s Ray 2 with audio generation',
    apiModelId: 'Luma/ray2',
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
  model: 'wan-ai/wan2.1-t2v-14b',
  duration: 5,
  aspectRatio: '16:9',
  useImageReference: false,
  referenceImageUrl: '',
  enableSound: false,
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
  type: 'video' | 'text' | 'pending';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  content: string;        // For text: the text content; For video: the video URL
  videoUrl?: string;      // Direct video URL if available
  thumbnailUrl?: string;  // Video thumbnail if available
  duration?: number;      // Video duration in seconds
  prompt?: string;        // The generated prompt that was used
  taskId?: string;        // Together AI task ID for polling
  progress?: number;      // Progress percentage (0-100)
  error?: string;         // Error message if failed
}
