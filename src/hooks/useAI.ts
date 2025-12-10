import { useState, useCallback, useRef, useEffect } from 'react';
import { Settings, AIConfig, DEFAULT_AI_CONFIG, VideoConfig, VideoGenerationResult } from '@/types';
import { sendToAI, generateVideo, pollVideoTask } from '@/services/ai';

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [videoResult, setVideoResult] = useState<VideoGenerationResult | null>(null);
  const [videoPolling, setVideoPolling] = useState(false);
  
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const settingsRef = useRef<Settings | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setVideoPolling(false);
  }, []);

  const startPolling = useCallback((taskId: string, prompt: string) => {
    if (!settingsRef.current) return;
    
    setVideoPolling(true);
    let pollCount = 0;
    const maxPolls = 60; // Max 5 minutes (60 * 5s)
    
    pollingRef.current = setInterval(async () => {
      pollCount++;
      
      if (pollCount > maxPolls) {
        stopPolling();
        setError('Video generation timed out. Please try again.');
        setVideoResult(prev => prev ? { ...prev, status: 'failed', error: 'Timeout' } : null);
        return;
      }

      try {
        const response = await pollVideoTask(taskId, settingsRef.current!);
        console.log('[Polling] Result:', response);
        
        if (response.result.status === 'completed' && response.result.videoUrl) {
          stopPolling();
          setVideoResult({
            ...response.result,
            prompt: prompt,
          });
          setLoading(false);
        } else if (response.result.status === 'failed') {
          stopPolling();
          setError(response.error || 'Video generation failed');
          setVideoResult({
            ...response.result,
            prompt: prompt,
            type: 'text',
          });
          setLoading(false);
        } else {
          // Update progress
          setVideoResult(prev => prev ? {
            ...prev,
            status: response.result.status,
            progress: response.result.progress || (pollCount * 2),
          } : null);
        }
      } catch (err) {
        console.error('[Polling] Error:', err);
        // Don't stop on network errors, keep trying
      }
    }, 5000); // Poll every 5 seconds
  }, [stopPolling]);

  const sendPrompt = useCallback(async (
    userContent: string,
    settings: Settings,
    aiConfig: AIConfig = DEFAULT_AI_CONFIG
  ) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setVideoResult(null);
    stopPolling();

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
  }, [stopPolling]);

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
    stopPolling();
    
    settingsRef.current = settings;

    try {
      const response = await generateVideo(productDescription, videoSystemPrompt, videoConfig, settings);
      
      if (response.error && !response.result.taskId) {
        // Error without task ID means complete failure
        setError(response.error);
        if (response.result.prompt) {
          setVideoResult({
            ...response.result,
            type: 'text',
            status: 'failed',
          });
        }
        setLoading(false);
        return response.result;
      }

      setVideoResult(response.result);

      // If pending, start polling
      if (response.result.type === 'pending' && response.result.taskId) {
        startPolling(response.result.taskId, response.result.prompt || '');
        return response.result;
      }

      // If already completed or failed
      setLoading(false);
      return response.result;
    } catch (err) {
      setError(String(err));
      setLoading(false);
      return null;
    }
  }, [stopPolling, startPolling]);

  const clearResult = useCallback(() => {
    setResult(null);
    setVideoResult(null);
    setError(null);
    stopPolling();
  }, [stopPolling]);

  return {
    loading,
    error,
    result,
    videoResult,
    videoPolling,
    sendPrompt,
    sendVideoRequest,
    clearResult,
    stopPolling,
  };
}
