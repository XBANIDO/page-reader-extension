import { Settings, AIConfig, VideoConfig, VideoGenerationResult, VIDEO_MODELS } from '@/types';

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | MessageContent[];
}

interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

interface AIResponse {
  content: string;
  error?: string;
}

interface VideoResponse {
  result: VideoGenerationResult;
  error?: string;
}

// Together AI Video API response types
interface TogetherVideoTask {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  output?: {
    video_url?: string;
    url?: string;
  };
  result?: {
    url?: string;
  };
  error?: string;
}

export async function sendToAI(
  userContent: string,
  settings: Settings,
  aiConfig: AIConfig
): Promise<AIResponse> {
  if (!settings.apiKey) {
    return { content: '', error: 'API Key not configured' };
  }

  // Use the systemPrompt directly - it already includes all config options
  const messages: AIMessage[] = [
    { role: 'system', content: aiConfig.systemPrompt },
    { role: 'user', content: userContent }
  ];

  // Build request body
  const requestBody: Record<string, unknown> = {
    model: settings.model,
    messages,
  };

  // Add optional parameters based on config
  if (aiConfig.enableWebSearch) {
    requestBody.web_search = true;
  }

  // Map reasoning effort to temperature
  const reasoningMap: Record<string, number> = {
    'low': 0.3,
    'medium': 0.7,
    'high': 1.0,
  };
  requestBody.temperature = reasoningMap[aiConfig.reasoningEffort] || 0.7;

  try {
    const response = await fetch(`${settings.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      return { content: '', error: error.error?.message || `API Error: ${response.status}` };
    }

    const data = await response.json();
    return { content: data.choices?.[0]?.message?.content || '' };
  } catch (err) {
    return { content: '', error: String(err) };
  }
}

// Legacy function for backwards compatibility
export function buildPrompt(
  pageContent: string,
  formatTemplate: string,
  formatType: 'json' | 'xml' | 'custom'
): string {
  let formatInstruction = '';
  
  if (formatType === 'json') {
    formatInstruction = `Please analyze the content and return the result in the following JSON format. Only return valid JSON, no other text:

\`\`\`json
${formatTemplate}
\`\`\``;
  } else if (formatType === 'xml') {
    formatInstruction = `Please analyze the content and return the result in the following XML format. Only return valid XML, no other text:

\`\`\`xml
${formatTemplate}
\`\`\``;
  } else {
    formatInstruction = formatTemplate;
  }

  return `${formatInstruction}

---

Here is the content to analyze:

${pageContent}`;
}

// Generate video prompt using text AI model
export async function generateVideoPrompt(
  productDescription: string,
  videoSystemPrompt: string,
  settings: Settings
): Promise<{ prompt: string; error?: string }> {
  if (!settings.apiKey) {
    return { prompt: '', error: 'Text API Key not configured' };
  }

  const promptMessages: AIMessage[] = [
    { role: 'system', content: videoSystemPrompt },
    { role: 'user', content: productDescription }
  ];

  try {
    const response = await fetch(`${settings.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: settings.model,
        messages: promptMessages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      return { prompt: '', error: error.error?.message || `Prompt API Error: ${response.status}` };
    }

    const data = await response.json();
    const generatedPrompt = data.choices?.[0]?.message?.content || '';
    return { prompt: generatedPrompt };
  } catch (err) {
    return { prompt: '', error: String(err) };
  }
}

// Create video generation task using Together AI API
export async function createVideoTask(
  prompt: string,
  videoConfig: VideoConfig,
  settings: Settings
): Promise<VideoResponse> {
  if (!settings.videoApiKey) {
    return { 
      result: { type: 'text', status: 'failed', content: prompt, prompt },
      error: 'Video API Key (Together AI) not configured. Please add it in Settings.' 
    };
  }

  const modelConfig = VIDEO_MODELS.find(m => m.name === videoConfig.model);
  if (!modelConfig) {
    return { 
      result: { type: 'text', status: 'failed', content: prompt, prompt },
      error: 'Invalid video model selected' 
    };
  }

  try {
    // Build request body based on model type
    const requestBody: Record<string, unknown> = {
      model: modelConfig.apiModelId,
      prompt: prompt,
      duration_seconds: videoConfig.duration,
      aspect_ratio: videoConfig.aspectRatio,
    };

    // Add image reference for image-to-video models
    if (videoConfig.useImageReference && videoConfig.referenceImageUrl && modelConfig.supportsImageReference) {
      requestBody.image_url = videoConfig.referenceImageUrl;
    }

    // Add audio for models that support it
    if (videoConfig.enableSound && modelConfig.supportsSoundGeneration) {
      requestBody.audio = true;
    }

    console.log('[Video API] Creating video task:', requestBody);

    const response = await fetch(`${settings.videoBaseUrl}/video/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.videoApiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      console.error('[Video API] Error:', error);
      return { 
        result: { type: 'text', status: 'failed', content: prompt, prompt },
        error: `Video API Error: ${error.error?.message || error.message || response.status}` 
      };
    }

    const data: TogetherVideoTask = await response.json();
    console.log('[Video API] Task created:', data);

    // Check if video is already completed (synchronous response)
    if (data.status === 'completed' && (data.output?.video_url || data.output?.url || data.result?.url)) {
      const videoUrl = data.output?.video_url || data.output?.url || data.result?.url;
      return {
        result: {
          type: 'video',
          status: 'completed',
          content: prompt,
          videoUrl: videoUrl,
          duration: videoConfig.duration,
          prompt: prompt,
          taskId: data.id,
          progress: 100,
        }
      };
    }

    // Return pending status for polling
    return {
      result: {
        type: 'pending',
        status: data.status || 'pending',
        content: prompt,
        prompt: prompt,
        taskId: data.id,
        progress: 0,
      }
    };
  } catch (err) {
    console.error('[Video API] Exception:', err);
    return { 
      result: { type: 'text', status: 'failed', content: prompt, prompt },
      error: String(err) 
    };
  }
}

// Poll video task status
export async function pollVideoTask(
  taskId: string,
  settings: Settings
): Promise<VideoResponse> {
  if (!settings.videoApiKey) {
    return { 
      result: { type: 'text', status: 'failed', content: '', taskId },
      error: 'Video API Key not configured' 
    };
  }

  try {
    const response = await fetch(`${settings.videoBaseUrl}/video/generations/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${settings.videoApiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      return { 
        result: { type: 'pending', status: 'processing', content: '', taskId },
        error: `Poll Error: ${error.error?.message || response.status}` 
      };
    }

    const data: TogetherVideoTask = await response.json();
    console.log('[Video API] Poll result:', data);

    if (data.status === 'completed') {
      const videoUrl = data.output?.video_url || data.output?.url || data.result?.url;
      if (videoUrl) {
        return {
          result: {
            type: 'video',
            status: 'completed',
            content: '',
            videoUrl: videoUrl,
            taskId: taskId,
            progress: 100,
          }
        };
      }
    }

    if (data.status === 'failed') {
      return {
        result: {
          type: 'text',
          status: 'failed',
          content: '',
          taskId: taskId,
          error: data.error || 'Video generation failed',
        },
        error: data.error || 'Video generation failed'
      };
    }

    // Still processing
    return {
      result: {
        type: 'pending',
        status: data.status || 'processing',
        content: '',
        taskId: taskId,
        progress: data.status === 'processing' ? 50 : 10,
      }
    };
  } catch (err) {
    return { 
      result: { type: 'pending', status: 'processing', content: '', taskId },
      error: String(err) 
    };
  }
}

// Combined function for backwards compatibility
export async function generateVideo(
  productDescription: string,
  videoSystemPrompt: string,
  videoConfig: VideoConfig,
  settings: Settings
): Promise<VideoResponse> {
  // Step 1: Generate the video prompt
  const promptResult = await generateVideoPrompt(productDescription, videoSystemPrompt, settings);
  
  if (promptResult.error || !promptResult.prompt) {
    return {
      result: { type: 'text', status: 'failed', content: '' },
      error: promptResult.error || 'Failed to generate video prompt'
    };
  }

  // Step 2: Create video task with Together AI
  const videoResult = await createVideoTask(promptResult.prompt, videoConfig, settings);
  
  // Preserve the generated prompt in the result
  if (videoResult.result) {
    videoResult.result.prompt = promptResult.prompt;
  }

  return videoResult;
}
