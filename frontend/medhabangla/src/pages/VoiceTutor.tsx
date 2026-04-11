import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const VoiceTutor: React.FC = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
    
    const recognitionRef = useRef<any>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US'; // Or bn-BD

            recognitionRef.current.onresult = (event: any) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    setTranscript(finalTranscript);
                    handleTranscriptSubmit(finalTranscript);
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        } else {
            console.warn("Speech Recognition API not supported in this browser.");
        }
    }, []);

    const startListening = () => {
        if (recognitionRef.current) {
            setTranscript('');
            setIsListening(true);
            recognitionRef.current.start();
        } else {
            alert('Your browser does not support Voice Recognition. Please use Chrome, Edge, or Safari.');
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    const handleTranscriptSubmit = async (text: string) => {
        if (!text.trim()) return;
        
        setMessages(prev => [...prev, { role: 'user', text }]);
        setIsLoading(true);
        
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/ai/voice-tutor/', 
                { message: text }, 
                { headers: { Authorization: \Token \\ } }
            );
            
            const replyText = res.data.text;
            const audioBase64 = res.data.audio_base64;
            
            setMessages(prev => [...prev, { role: 'ai', text: replyText }]);
            setAiResponse(replyText);
            
            if (audioBase64) {
                // Play ElevenLabs audio
                if (audioRef.current) {
                    audioRef.current.src = \data:audio/mp3;base64,\\;
                    audioRef.current.play();
                }
            } else {
                // Web Speech API fallback
                const utterance = new SpeechSynthesisUtterance(replyText);
                window.speechSynthesis.speak(utterance);
            }
            
        } catch (error) {
            console.error('Voice Tutor Error:', error);
            setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I'm having trouble thinking right now." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 min-h-[80vh] flex flex-col items-center justify-center">
            <h1 className="text-3xl font-bold mb-8 text-center text-gray-800 dark:text-white">??? AI Voice Tutor</h1>
            
            {/* Audio Element for TTS */}
            <audio ref={audioRef} className="hidden" />

            <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[500px]">
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <span className="text-5xl mb-4">??</span>
                            <p>Tap the mic and say "Tell me about Newton's laws."</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <div key={idx} className={\lex \\}>
                                <div className={\max-w-[70%] p-4 rounded-2xl \\}>
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                </div>
                            </div>
                        ))
                    )}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-2xl rounded-bl-none">
                                <p className="animate-pulse">Thinking & Synthesizing...</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex flex-col items-center">
                    <button
                        onMouseDown={startListening}
                        onMouseUp={stopListening}
                        onTouchStart={startListening}
                        onTouchEnd={stopListening}
                        className={\w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-lg transition-transform transform hover:scale-105 \\}
                    >
                        ???
                    </button>
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                        {isListening ? 'Listening... release to send' : 'Hold to speak'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VoiceTutor;
