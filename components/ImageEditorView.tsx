
import React, { useState, useCallback } from 'react';
import { analyzeImage, editImage } from '../services/geminiService';
import { fileToBase64 } from '../services/utils';
import LoadingSpinner from './LoadingSpinner';

type EditMode = 'analyze' | 'edit';

const ImageEditorView: React.FC = () => {
  const [mode, setMode] = useState<EditMode>('edit');
  const [prompt, setPrompt] = useState('');
  const [originalImage, setOriginalImage] = useState<{ url: string; base64: string; mimeType: string; } | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setOriginalImage(null);
      setResult(null);
      setError(null);
      try {
        const { base64, mimeType } = await fileToBase64(file);
        setOriginalImage({
            url: URL.createObjectURL(file),
            base64,
            mimeType,
        });
      } catch (e) {
          setError("Failed to read file.");
      }
    }
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || !originalImage || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      if (mode === 'analyze') {
        const analysisText = await analyzeImage(prompt, originalImage.base64, originalImage.mimeType);
        setResult(analysisText);
      } else {
        const editedImageBase64 = await editImage(prompt, originalImage.base64, originalImage.mimeType);
        setResult(`data:image/png;base64,${editedImageBase64}`);
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Request failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-800 rounded-lg overflow-hidden p-6">
      <h2 className="text-2xl font-bold mb-2">Image Studio</h2>
      <p className="text-gray-400 mb-4">Upload an image to analyze its contents or edit it with a prompt.</p>

      {!originalImage && (
         <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-lg">
            <input type="file" accept="image/*" onChange={handleFileChange} className="absolute w-full h-full opacity-0 cursor-pointer" />
            <p className="text-gray-400">Click or drag to upload an image</p>
         </div>
      )}

      {originalImage && (
        <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
            <div className="flex-1 flex flex-col gap-4">
                 <img src={originalImage.url} alt="Original" className="w-full h-auto object-contain rounded-lg max-h-64 md:max-h-full" />
                 <button onClick={() => setOriginalImage(null)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors w-full">
                    Change Image
                 </button>
            </div>
            <div className="flex-1 flex flex-col gap-4">
                <div className="flex bg-gray-700 rounded-lg p-1">
                    <button onClick={() => setMode('edit')} className={`flex-1 p-2 rounded-md font-semibold transition-colors ${mode === 'edit' ? 'bg-cyan-500' : 'hover:bg-gray-600'}`}>Edit</button>
                    <button onClick={() => setMode('analyze')} className={`flex-1 p-2 rounded-md font-semibold transition-colors ${mode === 'analyze' ? 'bg-cyan-500' : 'hover:bg-gray-600'}`}>Analyze</button>
                </div>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={mode === 'edit' ? "e.g., Add a retro filter" : "e.g., What is in this image?"}
                    className="flex-1 bg-gray-700 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    rows={4}
                />
                <button onClick={handleSubmit} disabled={isLoading || !prompt} className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 text-white font-bold py-3 px-5 rounded-lg transition-colors">
                    {isLoading ? 'Processing...' : `Submit for ${mode === 'edit' ? 'Editing' : 'Analysis'}`}
                </button>
                <div className="flex-grow bg-gray-900 rounded-lg flex items-center justify-center p-4 min-h-[200px]">
                    {isLoading && <LoadingSpinner />}
                    {error && <p className="text-red-400 text-center">{error}</p>}
                    {result && !isLoading && (
                        mode === 'edit' ?
                        <img src={result} alt="Edited" className="max-w-full max-h-full object-contain rounded-lg"/> :
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

export default ImageEditorView;
