import { useState, useCallback } from 'react';
import { Settings, AIConfig, DEFAULT_AI_CONFIG, VideoConfig, VideoGenerationResult } from '@/types';
import { sendToAI, generateVideo } from '@/services/ai';

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [videoResult, setVideoResult] = useState<VideoGenerationResult | null>(null);

  const sendPrompt = useCallback(async (
    userContent: string,
    settings: Settings,
    aiConfig: AIConfig = DEFAULT_AI_CONFIG
  ) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setVideoResult(null);

    try {
      const response = await sendToAI(userContent, settings, aiConfig);
      
      if (response.error) {
        setError(response.error);
        return null;
      }

      setResult(response.content);
      return response.content;
    } catch (err) {
      setError(String(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendVideoRequest = useCallback(async (
    productDescription: string,
    videoSystemPrompt: string,
    videoConfig: VideoConfig,
    settings: Settings
  ) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setVideoResult(null);

    try {
      const response = await generateVideo(productDescription, videoSystemPrompt, videoConfig, settings);
      
      if (response.error) {
        // Still set the result even if there's an error (might have fallback prompt)
        if (response.result.content) {
          setVideoResult(response.result);
        }
        setError(response.error);
        return response.result;
      }

      setVideoResult(response.result);
      return response.result;
    } catch (err) {
      setError(String(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setVideoResult(null);
    setError(null);
  }, []);

  return {
    loading,
    error,
    result,
    videoResult,
    sendPrompt,
    sendVideoRequest,
    clearResult,
  };
}
