
import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, GroundingSource } from '../types';
import OrionAvatar from './OrionAvatar';
import { PLUS_ICON, MIC_ICON, SEND_ICON, PAPERCLIP_ICON } from '../constants';
import { transcribeAudio } from '../services/geminiService';
import { fileToBase64 } from '../services/utils';

const ChatMessageComponent: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isUser = message.role === 'user';
    return (
        <div className={`flex items-start gap-4 my-4 animate-fadeInUp ${isUser ? 'justify-end' : ''}`}>
            {!isUser && (
                <OrionAvatar state="idle" />
            )}
            <div className={`p-4 rounded-2xl max-w-xl ${isUser ? 'bg-blue-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}>
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.sources && message.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-600">
                        <h4 className="text-xs font-semibold text-gray-400 mb-2">Sources:</h4>
                        <div className="flex flex-col gap-2">
                            {message.sources.map((source, index) => (
                                <a
                                    key={index}
                                    href={source.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-cyan-400 hover:underline truncate"
                                >
                                    {source.title || source.uri}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
             {isUser && (
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {/* You could add user initial here if you pass username down */}
                    U
                </div>
            )}
        </div>
    );
};

interface ChatViewProps {
    messages: ChatMessage[];
    onSendMessage: (
        message: string,
        model: 'gemini-flash-lite-latest' | 'gemini-2.5-flash' | 'gemini-2.5-pro',
        useSearch: boolean,
        useMaps: boolean,
        attachment?: { base64: string; mimeType: string }
    ) => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

const ChatView: React.FC<ChatViewProps> = ({ messages, onSendMessage, isLoading, error }) => {
  const [input, setInput] = useState('');
  const [model, setModel] = useState<'gemini-flash-lite-latest' | 'gemini-2.5-flash' | 'gemini-2.5-pro'>('gemini-2.5-flash');
  const [useSearch, setUseSearch] = useState(false);
  const [useMaps, setUseMaps] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<{ url: string; base64: string; mimeType: string; } | null>(null);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isLoading]);
  
  // Close attachment menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
        setIsAttachmentMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = async () => {
    if ((!input.trim() && !attachment) || isLoading) return;
    const messageToSend = input;
    const attachmentToSend = attachment;
    setInput('');
    setAttachment(null);
    await onSendMessage(messageToSend, model, useSearch, useMaps, attachmentToSend ? { base64: attachmentToSend.base64, mimeType: attachmentToSend.mimeType } : undefined);
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        setIsAttachmentMenuOpen(false);
        try {
            const { base64, mimeType } = await fileToBase64(file);
            setAttachment({
                url: URL.createObjectURL(file),
                base64,
                mimeType,
            });
        } catch (e) {
            // Handle file read error
            console.error("File read error:", e);
        }
    }
    event.target.value = ''; // Allow re-uploading the same file
  };

  const handleStartRecording = async () => {
      setIsRecording(true);
      setTranscriptionError(null);
      audioChunksRef.current = [];
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaRecorderRef.current = new MediaRecorder(stream);
          mediaRecorderRef.current.ondataavailable = (event) => {
              audioChunksRef.current.push(event.data);
          };
          mediaRecorderRef.current.onstop = async () => {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              const audioFile = new File([audioBlob], "recording.webm", { type: 'audio/webm' });
              try {
                  const { base64, mimeType } = await fileToBase64(audioFile);
                  const result = await transcribeAudio(base64, mimeType);
                  setInput(prev => prev ? `${prev} ${result}` : result);
              } catch (e) {
                  setTranscriptionError("Failed to transcribe audio.");
              }
          };
          mediaRecorderRef.current.start();
      } catch (err) {
          setTranscriptionError("Mic permission denied.");
          setIsRecording(false);
      }
  };

  const handleStopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
          setIsRecording(false);
      }
  };

  const handleMicClick = () => {
      if (isRecording) {
          handleStopRecording();
      } else {
          handleStartRecording();
      }
  };
  
  return (
    <div className="h-full flex flex-col bg-gray-800 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
            <h2 className="text-xl font-bold">OrionAI Chat</h2>
            <div className="flex items-center gap-4 mt-2 text-sm">
                <select value={model} onChange={e => setModel(e.target.value as any)} className="bg-gray-700 border border-gray-600 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="gemini-flash-lite-latest">Flash Lite (Fast)</option>
                    <option value="gemini-2.5-flash">Flash (Balanced)</option>
                    <option value="gemini-2.5-pro">Pro (Complex)</option>
                </select>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={useSearch} onChange={() => setUseSearch(!useSearch)} className="form-checkbox h-4 w-4 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-500"/>
                    <span>Google Search</span>
                </label>
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={useMaps} onChange={() => setUseMaps(!useMaps)} className="form-checkbox h-4 w-4 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-500"/>
                    <span>Google Maps</span>
                </label>
            </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto">
            {messages.length === 0 && !isLoading && (
                <div className="text-center text-gray-400">
                    <p>Welcome to OrionAI. How can I help you today? 😊</p>
                </div>
            )}
            {messages.map((msg, index) => (
                <ChatMessageComponent key={index} message={msg} />
            ))}
            {isLoading && (
                <div className="flex items-start gap-4 my-4 animate-fadeInUp">
                    <OrionAvatar state="thinking" />
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-700">
            {(error || transcriptionError) && <p className="text-red-400 text-sm mb-2 text-center">{error || transcriptionError}</p>}
            {attachment && (
                <div className="relative inline-block mb-2">
                    <img src={attachment.url} alt="Attachment preview" className="h-20 w-20 object-cover rounded-md" />
                    <button onClick={() => setAttachment(null)} className="absolute -top-2 -right-2 bg-gray-900 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">&times;</button>
                </div>
            )}
            <div className="relative flex items-center gap-2 bg-gray-700 rounded-full p-2">
                <div ref={attachmentMenuRef}>
                    <button onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)} className="p-2 rounded-full hover:bg-gray-600 transition-colors" aria-label="Attach file">
                        {PLUS_ICON}
                    </button>
                    {isAttachmentMenuOpen && (
                        <div className="absolute bottom-14 left-0 bg-gray-800 rounded-lg shadow-xl p-2 w-60 border border-gray-700">
                            <label className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-700 cursor-pointer">
                                {PAPERCLIP_ICON}
                                <span>Add photos & files</span>
                                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                            </label>
                        </div>
                    )}
                </div>
                <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder={attachment ? "Ask about the image..." : "Ask anything..."}
                    className="flex-1 bg-transparent p-2 resize-none focus:outline-none text-white placeholder-gray-400"
                    rows={1}
                />
                {(input.trim() || attachment) ? (
                    <button onClick={handleSend} disabled={isLoading} className="p-2 rounded-full bg-cyan-500 text-white hover:bg-cyan-600 disabled:bg-gray-500 transition-colors" aria-label="Send message">
                        {SEND_ICON}
                    </button>
                ) : (
                    <button onClick={handleMicClick} className={`p-2 rounded-full hover:bg-gray-600 transition-colors ${isRecording ? 'text-red-500' : ''}`} aria-label={isRecording ? 'Stop recording' : 'Start recording'}>
                        {isRecording && <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-red-400 opacity-75"></span>}
                        {MIC_ICON}
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};

export default ChatView;