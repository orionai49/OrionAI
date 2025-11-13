
import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { DOWNLOAD_ICON } from '../constants';

const styles = {
    'Photorealistic': 'A photorealistic image with true-to-life textures, realistic colors, 8K detail',
    'Cinematic': 'A cinematic shot with deep contrast, dramatic lighting, realistic tones',
    'Cyberpunk': 'A cyberpunk scene with neon lights, futuristic mood, vibrant reflections',
    'Fantasy': 'A fantasy artwork with magical, soft lighting, ethereal atmosphere',
    'Illustration': 'An artistic illustration with a colorful, hand-drawn appearance',
    'Anime': 'An anime style art with vibrant colors, expressive faces, clean outlines, stylized lighting',
};
type StyleKey = keyof typeof styles;

const aspectRatios = {
    'Square (1:1)': '1:1',
    'Landscape (16:9)': '16:9',
    'Portrait (9:16)': '9:16',
};
type AspectRatioKey = keyof typeof aspectRatios;

const ImageGeneratorView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<StyleKey>('Photorealistic');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatioKey>('Square (1:1)');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setImageUrl(null);

    const fullPrompt = `${styles[selectedStyle]} of ${prompt}`;
    const aspectRatioValue = aspectRatios[selectedAspectRatio];

    try {
      const base64Image = await generateImage(fullPrompt, aspectRatioValue);
      setImageUrl(`data:image/jpeg;base64,${base64Image}`);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to generate image: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getSafeFilename = (p: string) => {
    return p.substring(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'image';
  }

  return (
    <div className="h-full flex flex-col bg-gray-800 rounded-lg overflow-hidden p-6">
      <h2 className="text-2xl font-bold mb-4">Image Generator</h2>
      <p className="text-gray-400 mb-2">Describe what you want to create, then choose your preferred image style.</p>
      
      <div className="flex flex-col gap-4 mb-6">
        <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., a cat astronaut on Mars"
            className="w-full bg-gray-700 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
            rows={2}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">🎨 Style</label>
                <select 
                    value={selectedStyle} 
                    onChange={e => setSelectedStyle(e.target.value as StyleKey)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                    {Object.keys(styles).map(key => <option key={key} value={key}>{key}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">🖼️ Size</label>
                <select 
                    value={selectedAspectRatio}
                    onChange={e => setSelectedAspectRatio(e.target.value as AspectRatioKey)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                    {Object.keys(aspectRatios).map(key => <option key={key} value={key}>{key}</option>)}
                </select>
            </div>
        </div>
        <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt}
            className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 text-white font-bold py-3 px-5 rounded-lg transition-colors"
        >
            {isLoading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {error && <p className="text-red-400 text-center mb-4">{error}</p>}
      
      <div className="flex-1 bg-gray-900 rounded-lg flex items-center justify-center p-4">
        {isLoading && <LoadingSpinner />}
        {imageUrl && !isLoading && (
            <div className="flex flex-col items-center gap-4">
                <img src={imageUrl} alt="Generated" className="max-w-full max-h-[60vh] rounded-lg shadow-lg"/>
                <a 
                    href={imageUrl} 
                    download={`orionai-${getSafeFilename(prompt)}.jpeg`}
                    className="mt-2 flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    aria-label="Download image"
                >
                    {DOWNLOAD_ICON}
                    <span>Download Image</span>
                </a>
            </div>
        )}
        {!imageUrl && !isLoading && (
            <p className="text-gray-500">Your generated image will appear here.</p>
        )}
      </div>
    </div>
  );
};

export default ImageGeneratorView;