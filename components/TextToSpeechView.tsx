
import React, { useState, useRef, useEffect } from 'react';
import { generateSpeech } from '../services/geminiService';
import { decode, decodeAudioData } from '../services/utils';
import LoadingSpinner from './LoadingSpinner';

const TextToSpeechView: React.FC = () => {
  const [text, setText] = useState('Hello! I am OrionAI. I can convert text into speech.');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    // Initialize AudioContext on first interaction
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    
    return () => {
        // Cleanup audio resources
        audioSourceRef.current?.stop();
        audioContextRef.current?.close();
    }
  }, []);

  const handleGenerateAndPlay = async () => {
    if (!text.trim() || isLoading || !audioContextRef.current) return;

    setIsLoading(true);
    setError(null);
    
    if (audioSourceRef.current) {
        audioSourceRef.current.stop();
    }

    try {
      const audioBase64 = await generateSpeech(text);
      if (!audioBase64) {
        throw new Error("API did not return audio data.");
      }
      
      const audioBytes = decode(audioBase64);
      const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start();
      audioSourceRef.current = source;
      
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to generate speech: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-800 rounded-lg overflow-hidden p-6">
      <h2 className="text-2xl font-bold mb-4">Text-to-Speech</h2>
      <p className="text-gray-400 mb-6">Enter text to generate realistic speech with OrionAI.</p>

      <div className="flex flex-col gap-4 flex-1">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to convert to speech..."
          className="flex-1 bg-gray-700 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 text-lg"
        />
        <button
          onClick={handleGenerateAndPlay}
          disabled={isLoading}
          className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 text-white font-bold py-3 px-5 rounded-lg transition-colors w-full"
        >
          {isLoading ? 'Generating...' : 'Generate & Play'}
        </button>
         {isLoading && <div className="flex justify-center"><LoadingSpinner /></div>}
         {error && <p className="text-red-400 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default TextToSpeechView;
