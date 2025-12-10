import { Settings, AIConfig, VideoConfig, VideoGenerationResult } from '@/types';

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

// Video model name mapping for POE API
const VIDEO_MODEL_MAP: Record<string, string> = {
  'Veo-3.1': 'Veo-3',
  'Sora-2': 'Sora-2',
  'Kling-2.0': 'Kling-2',
  'Runway-Gen3': 'Runway-Gen3-Alpha',
};

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

// Generate video using POE API
export async function generateVideo(
  productDescription: string,
  videoSystemPrompt: string,
  videoConfig: VideoConfig,
  settings: Settings
): Promise<VideoResponse> {
  if (!settings.apiKey) {
    return { result: { type: 'text', content: '' }, error: 'API Key not configured' };
  }

  const modelName = VIDEO_MODEL_MAP[videoConfig.model] || 'Veo-3';

  // Step 1: Generate the video prompt using a text model
  const promptMessages: AIMessage[] = [
    { role: 'system', content: videoSystemPrompt },
    { role: 'user', content: productDescription }
  ];

  try {
    // First, generate the optimized video prompt
    const promptResponse = await fetch(`${settings.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: settings.model, // Use the text model to generate prompt
        messages: promptMessages,
        temperature: 0.7,
      }),
    });

    if (!promptResponse.ok) {
      const error = await promptResponse.json().catch(() => ({ error: { message: promptResponse.statusText } }));
      return { result: { type: 'text', content: '' }, error: error.error?.message || `Prompt API Error: ${promptResponse.status}` };
    }

    const promptData = await promptResponse.json();
    const generatedPrompt = promptData.choices?.[0]?.message?.content || '';

    if (!generatedPrompt) {
      return { result: { type: 'text', content: '' }, error: 'Failed to generate video prompt' };
    }

    // Step 2: Call the video generation model
    const videoMessages: AIMessage[] = [
      { 
        role: 'user', 
        content: videoConfig.useImageReference && videoConfig.referenceImageUrl
          ? [
              { type: 'text', text: generatedPrompt },
              { type: 'image_url', image_url: { url: videoConfig.referenceImageUrl } }
            ]
          : generatedPrompt 
      }
    ];

    const videoResponse = await fetch(`${settings.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: videoMessages,
      }),
    });

    if (!videoResponse.ok) {
      const error = await videoResponse.json().catch(() => ({ error: { message: videoResponse.statusText } }));
      // If video model fails, return the generated prompt as fallback
      return { 
        result: { 
          type: 'text', 
          content: generatedPrompt,
          prompt: generatedPrompt 
        }, 
        error: `Video generation failed: ${error.error?.message || videoResponse.status}. Showing generated prompt instead.` 
      };
    }

    const videoData = await videoResponse.json();
    const content = videoData.choices?.[0]?.message?.content || '';

    // Check if the response contains a video URL
    // POE API may return video in different formats:
    // 1. Direct URL in content
    // 2. Markdown image/video format
    // 3. Attachment URL
    const videoUrlMatch = content.match(/https?:\/\/[^\s<>"{}|\\^`\[\]]+\.(mp4|webm|mov|avi)/i);
    const attachmentUrl = videoData.choices?.[0]?.message?.attachments?.[0]?.url;
    
    if (attachmentUrl) {
      return {
        result: {
          type: 'video',
          content: content,
          videoUrl: attachmentUrl,
          duration: videoConfig.duration,
          prompt: generatedPrompt,
        }
      };
    } else if (videoUrlMatch) {
      return {
        result: {
          type: 'video',
          content: content,
          videoUrl: videoUrlMatch[0],
          duration: videoConfig.duration,
          prompt: generatedPrompt,
        }
      };
    } else {
      // No video URL found, return the prompt and any content
      return {
        result: {
          type: 'text',
          content: content || generatedPrompt,
          prompt: generatedPrompt,
        }
      };
    }
  } catch (err) {
    return { result: { type: 'text', content: '' }, error: String(err) };
  }
}
