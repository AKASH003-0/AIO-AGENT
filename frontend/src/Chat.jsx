import React, { useState, useRef, useEffect } from 'react';
import { streamMessage } from './api';
import './index.css';

export default function Chat() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [thinking, setThinking] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const endOfMessagesRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, thinking]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() && !selectedImage) return;
        if (isTyping) return;

        const userMsg = input.trim();
        const currentImage = selectedImage;
        setInput('');
        setSelectedImage(null);
        
        setMessages(prev => [...prev, { role: 'user', content: userMsg, image: currentImage }]);
        setIsTyping(true);
        setThinking(true);

        let currentAssistantResponse = "";
        setMessages(prev => [...prev, { role: 'assistant', content: "" }]);

        try {
            await streamMessage(userMsg || "What is in this image?", "default_session", (chunk) => {
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
            }, currentImage);
        } catch (error) {
            setThinking(false);
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                    role: 'assistant',
                    content: " [SIGNAL LOST]: Connection to Jarvis Core interrupted."
                };
                return newMessages;
            });
        }
        
        setThinking(false); // Double safety
        setIsTyping(false);


        if (voiceEnabled) {
            const cleanText = currentAssistantResponse.replace(/!\[.*?\]\(.*?\)/g, "").trim();
            if (cleanText) {
                const utterance = new SpeechSynthesisUtterance(cleanText);
                utterance.rate = 1.05;
                window.speechSynthesis.speak(utterance);
            }
        }
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
                            {msg.image && (
                                <img src={msg.image} alt="Upload" style={{ maxWidth: '100%', borderRadius: '4px', marginBottom: '10px', border: '1px solid var(--stark-blue)' }} />
                            )}
                            {(() => {
                                const content = msg.content || '';
                                return content;
                            })()}
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
                    {selectedImage && (
                        <div className="image-preview-bubble">
                            <img src={selectedImage} alt="Preview" />
                            <button onClick={() => setSelectedImage(null)}>×</button>
                        </div>
                    )}
                    <div className="input-wrapper">
                        <input 
                            type="file" 
                            accept="image/*" 
                            style={{ display: 'none' }} 
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                        />
                        <button 
                            type="button" 
                            className="upload-btn"
                            onClick={() => fileInputRef.current.click()}
                        >
                            +
                        </button>
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="INITIALIZE COMMAND SEQUENCE..."
                            autoFocus
                            disabled={isTyping}
                        />
                        <button type="submit" disabled={isTyping || (!input.trim() && !selectedImage)}>
                            EXECUTE
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
