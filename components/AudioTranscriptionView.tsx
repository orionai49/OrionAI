
import React, { useState, useRef } from 'react';
import { transcribeAudio } from '../services/geminiService';
import { fileToBase64 } from '../services/utils';
import LoadingSpinner from './LoadingSpinner';
import { MIC_ICON } from '../constants';

type RecordingStatus = 'idle' | 'recording' | 'processing' | 'error';

const AudioTranscriptionView: React.FC = () => {
    const [status, setStatus] = useState<RecordingStatus>('idle');
    const [transcription, setTranscription] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const handleStartRecording = async () => {
        setStatus('recording');
        setTranscription(null);
        setError(null);
        audioChunksRef.current = [];

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };
            mediaRecorderRef.current.onstop = handleTranscription;
            mediaRecorderRef.current.start();
        } catch (err) {
            setError("Could not access microphone. Please grant permission and try again.");
            setStatus('error');
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && status === 'recording') {
            mediaRecorderRef.current.stop();
            // Stop all media tracks to turn off the microphone indicator
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setStatus('processing');
        }
    };
    
    const handleTranscription = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Create a File object to use with existing utility
        const audioFile = new File([audioBlob], "recording.webm", { type: 'audio/webm' });
        
        try {
            const { base64, mimeType } = await fileToBase64(audioFile);
            const result = await transcribeAudio(base64, mimeType);
            setTranscription(result);
            setStatus('idle');
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Transcription failed: ${errorMessage}`);
            setStatus('error');
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setStatus('processing');
            setTranscription(null);
            setError(null);
            try {
                const { base64, mimeType } = await fileToBase64(file);
                const result = await transcribeAudio(base64, mimeType);
                setTranscription(result);
                setStatus('idle');
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
                setError(`Transcription failed: ${errorMessage}`);
                setStatus('error');
            }
            event.target.value = ''; // Allow re-uploading the same file
        }
    };
    
    const handleCopy = () => {
        if (transcription) {
            navigator.clipboard.writeText(transcription);
        }
    };

    const isRecording = status === 'recording';

    return (
        <div className="h-full flex flex-col bg-gray-800 rounded-lg overflow-hidden p-6 items-center">
            <h2 className="text-2xl font-bold mb-4">Audio Transcription</h2>
            <p className="text-gray-400 mb-8 text-center max-w-xl">
                Click the microphone to record your speech, or upload an audio file, and OrionAI will transcribe it for you.
            </p>

            <div className="flex flex-col items-center justify-start flex-1 w-full max-w-2xl">
                <button
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    disabled={status === 'processing'}
                    className={`relative flex items-center justify-center w-24 h-24 rounded-full transition-colors duration-300
                        ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-cyan-500 hover:bg-cyan-600'}
                        disabled:bg-gray-600 disabled:cursor-not-allowed`}
                    aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                >
                    {isRecording && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
                    {React.cloneElement(MIC_ICON, {className: 'h-12 w-12 text-white'})}
                </button>

                <p className="mt-6 text-lg font-semibold h-6">
                    {status === 'idle' && 'Click to start recording'}
                    {status === 'recording' && 'Recording... Click to stop'}
                </p>

                <div className="flex items-center w-full my-8">
                    <div className="flex-grow border-t border-gray-600"></div>
                    <span className="flex-shrink mx-4 text-gray-400">OR</span>
                    <div className="flex-grow border-t border-gray-600"></div>
                </div>

                <div className="w-full">
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-lg p-6 relative hover:border-cyan-500 transition-colors">
                        <input
                            type="file"
                            accept="audio/*"
                            onChange={handleFileChange}
                            className="absolute w-full h-full opacity-0 cursor-pointer"
                            disabled={status === 'processing' || status === 'recording'}
                        />
                        <p className="text-gray-400">Click or drag to upload an audio file</p>
                        <p className="text-xs text-gray-500 mt-1">(MP3, WAV, WEBM, etc.)</p>
                    </div>
                </div>
                
                <div className="w-full mt-8 space-y-4">
                    {status === 'processing' && (
                        <div className="flex flex-col items-center text-center">
                            <p className="text-lg font-semibold mb-2">Processing audio...</p>
                            <LoadingSpinner />
                        </div>
                    )}
                    {status === 'error' && <p className="text-red-400 text-center">{error}</p>}
                    
                    {transcription && (
                         <div className="w-full p-4 bg-gray-900 rounded-lg relative">
                            <h3 className="text-lg font-semibold mb-2 text-white">Transcription Result:</h3>
                            <button onClick={handleCopy} className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-xs px-2 py-1 rounded">Copy</button>
                            <p className="whitespace-pre-wrap text-gray-300">{transcription}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AudioTranscriptionView;
