
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import type { ChatMessage, LatLng } from '../types';
import { getOrionAISystemPrompt } from '../constants';

const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const getChatResponse = async (
    history: ChatMessage[],
    message: string,
    // Fix: Correct model name for flash lite according to guidelines
    model: 'gemini-flash-lite-latest' | 'gemini-2.5-flash' | 'gemini-2.5-pro',
    useSearch: boolean,
    useMaps: boolean,
    location: LatLng | null,
    username: string,
    attachment?: { base64: string; mimeType: string; }
): Promise<GenerateContentResponse> => {
    const ai = getAiClient();
    
    const userMessageParts: any[] = [{ text: message }];
    if (attachment) {
        userMessageParts.push({
            inlineData: {
                mimeType: attachment.mimeType,
                data: attachment.base64,
            }
        });
    }

    const contents = [...history.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }] // Note: History doesn't support images for now
    })), { role: 'user', parts: userMessageParts }];

    const tools: any[] = [];
    if (useSearch) tools.push({ googleSearch: {} });
    if (useMaps) tools.push({ googleMaps: {} });
    
    const toolConfig = useMaps && location ? {
        retrievalConfig: { latLng: location }
    } : undefined;

    return await ai.models.generateContent({
        model: model,
        contents: contents,
        config: {
            systemInstruction: getOrionAISystemPrompt(username),
            ...(tools.length > 0 && { tools }),
            ...(toolConfig && { toolConfig }),
            ...(model === 'gemini-2.5-pro' && { thinkingConfig: { thinkingBudget: 32768 } }),
        },
    });
};

export const generateImage = async (prompt: string, aspectRatio: string) => {
    const ai = getAiClient();
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: aspectRatio,
        },
    });
    return response.generatedImages[0].image.imageBytes;
};

export const analyzeImage = async (prompt: string, imageBase64: string, mimeType: string) => {
    const ai = getAiClient();
    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: imageBase64,
      },
    };
    const textPart = { text: prompt };
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
    });
    return response.text;
};

export const editImage = async (prompt: string, imageBase64: string, mimeType: string) => {
    const ai = getAiClient();
    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: imageBase64,
      },
    };
    const textPart = { text: prompt };
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }
    throw new Error("No image data found in response");
};

export const generateSpeech = async (text: string) => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

export const analyzeVideo = async (prompt: string, videoBase64: string, mimeType: string) => {
    const ai = getAiClient();
    const videoPart = {
        inlineData: {
            mimeType: mimeType,
            data: videoBase64,
        },
    };
    const textPart = { text: prompt };
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [videoPart, textPart] },
    });
    return response.text;
};

export const transcribeAudio = async (audioBase64: string, mimeType: string) => {
    const ai = getAiClient();
    const audioPart = {
        inlineData: {
            mimeType: mimeType,
            data: audioBase64,
        },
    };
    const textPart = { text: "Transcribe the following audio recording." };
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [audioPart, textPart] },
    });
    return response.text;
};
