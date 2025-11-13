
import React, { useState, useEffect, useCallback } from 'react';
import { AppView, ChatMessage, ChatSession, LatLng, GroundingSource } from '../types';
import { CHAT_ICON, IMAGE_ICON, EDIT_ICON, TTS_ICON, SPARK_ICON, ABOUT_ICON, CONTACT_ICON, LOGOUT_ICON, PLUS_ICON, TRASH_ICON, CHEVRON_LEFT_ICON, MENU_ICON, VIDEO_ICON, MIC_ICON } from '../constants';
import ChatView from './ChatView';
import ImageGeneratorView from './ImageGeneratorView';
import ImageEditorView from './ImageEditorView';
import TextToSpeechView from './TextToSpeechView';
import AboutView from './AboutView';
import ContactView from './ContactView';
import VideoAnalysisView from './VideoAnalysisView';
import AudioTranscriptionView from './AudioTranscriptionView';
import { getChatResponse } from '../services/geminiService';
import OrionAvatar from './OrionAvatar';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  view: AppView;
  currentView: AppView;
  setView: (view: AppView) => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, view, currentView, setView }) => (
  <button
    onClick={() => setView(view)}
    className={`flex items-center w-full p-3 rounded-lg transition-colors ${
      currentView === view ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
    }`}
    aria-current={currentView === view ? 'page' : undefined}
  >
    {icon}
    <span className="ml-4 font-semibold">{label}</span>
  </button>
);

interface MainLayoutProps {
    username: string;
    onLogout: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ username, onLogout }) => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [currentView, setCurrentView] = useState<AppView>(AppView.CHAT);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<LatLng | null>(null);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);

  const getHistoryStorageKey = useCallback(() => `orion_history_${username}`, [username]);

  // Load chat history from localStorage
  useEffect(() => {
    setIsHistoryLoaded(false);
    let loadedHistory: ChatSession[] = [];
    try {
      const storedHistoryJson = localStorage.getItem(getHistoryStorageKey());
      if (storedHistoryJson) {
        const parsedHistory = JSON.parse(storedHistoryJson);
        if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
          loadedHistory = parsedHistory;
        }
      }
    } catch (err) {
      console.error("Failed to load or parse chat history:", err);
    }

    if (loadedHistory.length === 0) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: "New Chat",
        messages: [],
        timestamp: Date.now(),
      };
      loadedHistory = [newSession];
    }

    setChatHistory(loadedHistory);
    setActiveSessionId(loadedHistory[0].id);
    setIsHistoryLoaded(true);
  }, [username, getHistoryStorageKey]);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (!isHistoryLoaded) {
      return; // Don't save until the initial load is complete
    }
    try {
      localStorage.setItem(getHistoryStorageKey(), JSON.stringify(chatHistory));
    } catch (err) {
      console.error("Failed to save chat history:", err);
    }
  }, [chatHistory, getHistoryStorageKey, isHistoryLoaded]);


  const handleNewChat = useCallback(() => {
    const newSession: ChatSession = {
        id: Date.now().toString(),
        title: "New Chat",
        messages: [],
        timestamp: Date.now(),
    };
    setChatHistory(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setCurrentView(AppView.CHAT);
  }, []);
  
  const handleDeleteChat = (sessionIdToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this chat? This action cannot be undone.")) {
        return;
    }

    const updatedHistory = chatHistory.filter(s => s.id !== sessionIdToDelete);
    
    if (updatedHistory.length === 0) {
        const newSession: ChatSession = { id: Date.now().toString(), title: "New Chat", messages: [], timestamp: Date.now() };
        setChatHistory([newSession]);
        setActiveSessionId(newSession.id);
    } else {
        setChatHistory(updatedHistory);
        if (activeSessionId === sessionIdToDelete) {
            setActiveSessionId(updatedHistory[0].id);
        }
    }
  };


  const handleSendMessage = async (
    message: string, 
    model: 'gemini-flash-lite-latest' | 'gemini-2.5-flash' | 'gemini-2.5-pro',
    useSearch: boolean, 
    useMaps: boolean,
    attachment?: { base64: string; mimeType: string; }
) => {
    if (!activeSessionId) return;

    // TODO: Add attachment to message history for display
    const userMessage: ChatMessage = { role: 'user', content: message };
    
    const activeSession = chatHistory.find(s => s.id === activeSessionId);
    if (!activeSession) return;

    const updatedMessages = [...activeSession.messages, userMessage];
    const updatedHistory = chatHistory.map(s => s.id === activeSessionId ? { ...s, messages: updatedMessages, title: s.messages.length === 0 ? message.substring(0, 40) || 'Image Query' : s.title } : s);
    setChatHistory(updatedHistory);

    setIsLoading(true);
    setError(null);
    
    if (useMaps && !location) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            () => {
                setError("Could not get location. Please enable location services.");
            }
        );
    }

    try {
      const response = await getChatResponse(
        activeSession.messages, // Pass only previous messages for history
        message, model, useSearch, useMaps, location, username, attachment
      );
      
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      const sources: GroundingSource[] = (groundingMetadata?.groundingChunks || [])
          .map((chunk: any) => {
              if (chunk.web) return { uri: chunk.web.uri, title: chunk.web.title };
              if (chunk.maps) return { uri: chunk.maps.uri, title: chunk.maps.title };
              return null;
          })
          .filter((source): source is GroundingSource => source !== null);

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.text,
        sources: sources.length > 0 ? sources : undefined,
      };

      setChatHistory(prev =>
        prev.map(s =>
            s.id === activeSessionId
                ? { ...s, messages: [...updatedMessages, assistantMessage] }
                : s
        )
      );

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to get response: ${errorMessage}`);
      // Revert the user's message on error
      setChatHistory(prev =>
          prev.map(s =>
              s.id === activeSessionId
                  ? { ...s, messages: s.messages.slice(0, -1) }
                  : s
          )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const activeSessionMessages = chatHistory.find(s => s.id === activeSessionId)?.messages || [];

  return (
    <div className="flex h-screen w-screen bg-gray-900 overflow-x-hidden">
        {/* Sidebar */}
        <aside className={`w-80 flex-shrink-0 bg-gray-800 flex flex-col p-4 border-r border-gray-700 transition-all duration-300 ease-in-out ${isSidebarVisible ? 'ml-0' : '-ml-80'}`}>
            <div className="flex items-center justify-center gap-3 mb-6 px-2 h-[48px] flex-shrink-0">
                {SPARK_ICON}
                <h1 className="text-2xl font-bold text-white">OrionAI</h1>
            </div>

            <button
                onClick={handleNewChat}
                className="flex items-center justify-center w-full p-2 mb-4 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition-colors flex-shrink-0"
            >
                {PLUS_ICON}
                <span className="ml-2">New Chat</span>
            </button>

            <div className="flex-1 overflow-y-auto pr-2 -mr-2 mb-4">
                <h3 className="px-1 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Chats</h3>
                <div className="space-y-1">
                    {chatHistory.map(session => (
                        <button
                            key={session.id}
                            onClick={() => { setActiveSessionId(session.id); setCurrentView(AppView.CHAT); }}
                            className={`group flex items-center w-full p-2 text-left rounded-lg transition-colors ${
                                activeSessionId === session.id && currentView === AppView.CHAT ? 'bg-gray-700' : 'text-gray-400 hover:bg-gray-700'
                            }`}
                        >
                            <span className="flex-1 truncate text-sm">{session.title}</span>
                            <span onClick={(e) => handleDeleteChat(session.id, e)} className="ml-2 p-1 rounded-full text-gray-500 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-opacity">
                                {TRASH_ICON}
                            </span>
                        </button>
                    ))}
                </div>
            </div>


            <nav className="space-y-4 flex-shrink-0">
                <div>
                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tools</h3>
                    <NavItem icon={CHAT_ICON} label="Chat" view={AppView.CHAT} currentView={currentView} setView={setCurrentView} />
                    <NavItem icon={IMAGE_ICON} label="Image Gen" view={AppView.IMAGE_GEN} currentView={currentView} setView={setCurrentView} />
                    <NavItem icon={EDIT_ICON} label="Image Studio" view={AppView.IMAGE_EDIT} currentView={currentView} setView={setCurrentView} />
                    <NavItem icon={VIDEO_ICON} label="Video Analysis" view={AppView.VIDEO_ANALYSIS} currentView={currentView} setView={setCurrentView} />
                    <NavItem icon={MIC_ICON} label="Audio Transcription" view={AppView.AUDIO_TRANSCRIPTION} currentView={currentView} setView={setCurrentView} />
                    <NavItem icon={TTS_ICON} label="TTS" view={AppView.TTS} currentView={currentView} setView={setCurrentView} />
                </div>
                 <div>
                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Information</h3>
                    <NavItem icon={ABOUT_ICON} label="About" view={AppView.ABOUT} currentView={currentView} setView={setCurrentView} />
                    <NavItem icon={CONTACT_ICON} label="Contact Us" view={AppView.CONTACT} currentView={currentView} setView={setCurrentView} />
                </div>
            </nav>

            <div className="mt-auto pt-4 border-t border-gray-700 flex-shrink-0">
                 <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-700">
                    <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center font-bold">
                            {username.charAt(0).toUpperCase()}
                        </div>
                        <span className="ml-3 font-semibold">{username}</span>
                    </div>
                    <button onClick={onLogout} className="p-2 rounded-full text-gray-400 hover:bg-red-500/20 hover:text-red-400" aria-label="Logout">
                        {LOGOUT_ICON}
                    </button>
                </div>
            </div>
        </aside>

        {/* Main Content */}
        <div className="relative flex-1 flex flex-col">
            <button
                onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                className={`fixed top-6 z-30 p-2 bg-gray-700/80 backdrop-blur-sm rounded-full text-white hover:bg-gray-600 transition-all duration-300 ease-in-out ${isSidebarVisible ? 'left-[18.5rem]' : 'left-4'}`}
                aria-label={isSidebarVisible ? 'Collapse sidebar' : 'Expand sidebar'}
            >
                {isSidebarVisible ? CHEVRON_LEFT_ICON : MENU_ICON}
            </button>
            <main className="flex-1 p-6 overflow-y-auto">
                {currentView === AppView.CHAT && (
                    <ChatView
                        messages={activeSessionMessages}
                        onSendMessage={handleSendMessage}
                        isLoading={isLoading}
                        error={error}
                    />
                )}
                {currentView === AppView.IMAGE_GEN && <ImageGeneratorView />}
                {currentView === AppView.IMAGE_EDIT && <ImageEditorView />}
                {currentView === AppView.VIDEO_ANALYSIS && <VideoAnalysisView />}
                {currentView === AppView.AUDIO_TRANSCRIPTION && <AudioTranscriptionView />}
                {currentView === AppView.TTS && <TextToSpeechView />}
                {currentView === AppView.ABOUT && <AboutView />}
                {currentView === AppView.CONTACT && <ContactView />}
            </main>
        </div>
    </div>
  );
};

export default MainLayout;