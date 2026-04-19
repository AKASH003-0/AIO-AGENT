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
        
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsTyping(true);
        setThinking(true);

        let currentAssistantResponse = "";
        setMessages(prev => [...prev, { role: 'assistant', content: "" }]);

        try {
            await streamMessage(userMsg, "default_session", (chunk) => {
                setThinking(false);
                currentAssistantResponse += chunk;
                
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                        role: 'assistant',
                        content: currentAssistantResponse
                    };
                    return newMessages;
                });
            });
        } catch (error) {
            setThinking(false);
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                    role: 'assistant',
                    content: " [SIGNAL ERROR]: Connection interrupted."
                };
                return newMessages;
            });
        }
        
        setThinking(false);
        setIsTyping(false);
    };

    return (
        <div className="chat-container">
            <header className="chat-header">
                <div className="status-indicator online"></div>
                <h1>Jarvis Core</h1>
                <button 
                    onClick={() => {
                        setVoiceEnabled(!voiceEnabled);
                        if (voiceEnabled) window.speechSynthesis.cancel();
                    }}
                >
                    {voiceEnabled ? 'Neural Audio [ON]' : 'Neural Audio [OFF]'}
                </button>
            </header>
            
            <div className="chat-log">
                {messages.length === 0 && (
                    <div className="message system">
                        SYSTEM READY. STANDING BY FOR COMMANDS.
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.role}`}>
                        <div className="avatar">{msg.role === 'user' ? 'STARK' : 'J.A.R.V.I.S'}</div>
                        <div className="content">
                            <div className="text-content">{msg.content}</div>
                            {msg.role === 'assistant' && isTyping && idx === messages.length - 1 && !thinking && (
                                <span className="blinking-cursor"></span>
                            )}
                        </div>
                    </div>
                ))}
                
                {thinking && (
                    <div className="message assistant thinking">
                        <div className="avatar">J.A.R.V.I.S</div>
                        <div className="content">ROUTING NEURAL PATHWAYS...</div>
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
                            placeholder="INITIALIZE COMMAND SEQUENCE..."
                            autoFocus
                            disabled={isTyping}
                        />
                        <button type="submit" disabled={isTyping || !input.trim()}>
                            EXECUTE
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
