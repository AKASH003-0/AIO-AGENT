import React, { useState, useRef, useEffect } from 'react';
import { streamMessage } from './api';
import './index.css';

export default function Chat() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [thinking, setThinking] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const endOfMessagesRef = useRef(null);

    const scrollToBottom = () => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, thinking]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isTyping) return;

        const userMsg = input.trim();
        setInput('');
        
        // Push user message immediately
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsTyping(true);
        setThinking(true); // Jarvis is routing/thinking...

        let currentAssistantResponse = "";
        
        // Push placeholder for assistant
        setMessages(prev => [...prev, { role: 'assistant', content: "" }]);

        await streamMessage(userMsg, "default_session", (chunk) => {
            setThinking(false); // Turn off thinking state as soon as chunks arrive
            currentAssistantResponse += chunk;
            
            // Constantly update the active message with incoming chunks
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                    role: 'assistant',
                    content: currentAssistantResponse
                };
                return newMessages;
            });
        });
        
        setIsTyping(false);

        // Phase 4: Native Voice Synthesis on complete
        if (voiceEnabled) {
            const cleanText = currentAssistantResponse.replace(/!\[.*?\]\(.*?\)/g, "").trim();
            if (cleanText) {
                const utterance = new SpeechSynthesisUtterance(cleanText);
                utterance.rate = 1.05;
                utterance.pitch = 0.95; // slightly robotic/deep
                window.speechSynthesis.speak(utterance);
            }
        }
    };

    return (
        <div className="chat-container">
            <header className="chat-header">
                <div className="status-indicator online"></div>
                <h1>AI Workspace</h1>
                <button 
                    style={{ marginLeft: 'auto', padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                    onClick={() => {
                        setVoiceEnabled(!voiceEnabled);
                        if (voiceEnabled) window.speechSynthesis.cancel();
                    }}
                >
                    {voiceEnabled ? 'VOICE ON' : 'VOICE OFF'}
                </button>
            </header>
            
            <div className="chat-log">
                {messages.length === 0 && (
                    <div className="message system">
                        How can I assist you today?
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.role}`}>
                        <div className="avatar">{msg.role === 'user' ? 'USR' : 'SYS'}</div>
                        <div className="content">
                            {(() => {
                                const content = msg.content || '';
                                const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
                                const parts = [];
                                let lastIndex = 0;
                                let match;
                                while ((match = imgRegex.exec(content)) !== null) {
                                    if (match.index > lastIndex) {
                                        parts.push(<span key={`text-${lastIndex}`}>{content.substring(lastIndex, match.index)}</span>);
                                    }
                                    parts.push(
                                        <img key={`img-${match.index}`} src={match[2]} alt={match[1]} style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '10px' }} />
                                    );
                                    lastIndex = imgRegex.lastIndex;
                                }
                                if (lastIndex < content.length) {
                                    parts.push(<span key={`text-${lastIndex}`}>{content.substring(lastIndex)}</span>);
                                }
                                return parts;
                            })()}
                            {/* Blinking cursor attachment */}
                            {msg.role === 'assistant' && isTyping && idx === messages.length - 1 && !thinking && (
                                <span className="blinking-cursor">|</span>
                            )}
                        </div>
                    </div>
                ))}
                
                {/* Advanced "Thinking" UI State */}
                {thinking && (
                    <div className="message assistant thinking">
                        <div className="avatar">SYS</div>
                        <div className="content">Processing intent...</div>
                    </div>
                )}
                <div ref={endOfMessagesRef} />
            </div>
            
            <form onSubmit={handleSubmit} className="chat-input-area">
                <div className="chat-input-form-inner">
                    <div className="input-wrapper">
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message here..."
                            autoFocus
                            disabled={isTyping}
                        />
                        <button type="submit" disabled={isTyping || !input.trim()}>
                            Send
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
