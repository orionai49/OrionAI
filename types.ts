
export enum AppView {
  CHAT = 'CHAT',
  IMAGE_GEN = 'IMAGE_GEN',
  IMAGE_EDIT = 'IMAGE_EDIT',
  VIDEO_ANALYSIS = 'VIDEO_ANALYSIS',
  AUDIO_TRANSCRIPTION = 'AUDIO_TRANSCRIPTION',
  TTS = 'TTS',
  ABOUT = 'ABOUT',
  CONTACT = 'CONTACT',
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: GroundingSource[];
}

export interface ChatSession {
    id: string;
    title: string;
    messages: ChatMessage[];
    timestamp: number;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface LatLng {
    latitude: number;
    longitude: number;
}