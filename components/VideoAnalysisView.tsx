
import React, { useState } from 'react';
import { analyzeVideo } from '../services/geminiService';
import { fileToBase64 } from '../services/utils';
import LoadingSpinner from './LoadingSpinner';

const VideoAnalysisView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [originalVideo, setOriginalVideo] = useState<{ url: string; base64: string; mimeType: string; } | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // Limit file size to 50MB
        setError("File is too large. Please upload a video under 50MB.");
        return;
      }
      setOriginalVideo(null);
      setResult(null);
      setError(null);
      setIsLoading(true);
      try {
        const { base64, mimeType } = await fileToBase64(file);
        setOriginalVideo({
            url: URL.createObjectURL(file),
            base64,
            mimeType,
        });
      } catch (e) {
          setError("Failed to read file.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || !originalVideo || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const analysisText = await analyzeVideo(prompt, originalVideo.base64, originalVideo.mimeType);
      setResult(analysisText);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Request failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-800 rounded-lg overflow-hidden p-6">
      <h2 className="text-2xl font-bold mb-2">Video Analysis</h2>
      <p className="text-gray-400 mb-4">Upload a video and ask OrionAI to analyze its contents.</p>

      {!originalVideo && (
         <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-lg relative">
            <input type="file" accept="video/*" onChange={handleFileChange} className="absolute w-full h-full opacity-0 cursor-pointer" disabled={isLoading} />
            {isLoading ? <LoadingSpinner /> : <p className="text-gray-400">Click or drag to upload a video (Max 50MB)</p>}
         </div>
      )}
       {error && !originalVideo && <p className="text-red-400 text-center mt-4">{error}</p>}


      {originalVideo && (
        <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
            <div className="flex-1 flex flex-col gap-4">
                 <video src={originalVideo.url} controls className="w-full h-auto object-contain rounded-lg max-h-64 md:max-h-full bg-black"></video>
                 <button onClick={() => { setOriginalVideo(null); setResult(null); setError(null); setPrompt(''); }} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors w-full">
                    Change Video
                 </button>
            </div>
            <div className="flex-1 flex flex-col gap-4">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={"e.g., What is happening in this video?"}
                    className="flex-1 bg-gray-700 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    rows={4}
                />
                <button onClick={handleSubmit} disabled={isLoading || !prompt} className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 text-white font-bold py-3 px-5 rounded-lg transition-colors">
                    {isLoading ? 'Processing...' : `Submit for Analysis`}
                </button>
                <div className="flex-grow bg-gray-900 rounded-lg flex items-center justify-center p-4 min-h-[200px]">
                    {isLoading && <LoadingSpinner />}
                    {error && <p className="text-red-400 text-center">{error}</p>}
                    {result && !isLoading && (
                        <p className="whitespace-pre-wrap text-left w-full h-full overflow-y-auto">{result}</p>
                    )}
                    {!result && !isLoading && !error && (
                         <p className="text-gray-500 text-center">Your result will appear here.</p>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default VideoAnalysisView;
