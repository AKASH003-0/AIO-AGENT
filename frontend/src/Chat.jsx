import React, { useState, useRef, useEffect } from 'react';
import { streamMessage } from './api';
import './index.css';

export default function Chat() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [attachedFile, setAttachedFile] = useState(null); // For PDFs/Docs
    const [isTyping, setIsTyping] = useState(false);
    const [thinking, setThinking] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const endOfMessagesRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => setSelectedImage(reader.result);
            reader.readAsDataURL(file);
        } else if (file.type === 'application/pdf') {
            const reader = new FileReader();
            reader.onload = async () => {
                const typedarray = new Uint8Array(reader.result);
                const pdf = await window.pdfjsLib.getDocument(typedarray).promise;
                let fullText = "";
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    fullText += textContent.items.map(item => item.str).join(" ") + "\n";
                }
                setAttachedFile({ name: file.name, text: fullText });
            };
            reader.readAsArrayBuffer(file);
        } else {
            // Assume text-based file
            const reader = new FileReader();
            reader.onload = () => setAttachedFile({ name: file.name, text: reader.result });
            reader.readAsText(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() && !selectedImage && !attachedFile) return;
        if (isTyping) return;

        const userMsg = input.trim();
        const currentImage = selectedImage;
        const currentFile = attachedFile;
        
        setInput('');
        setSelectedImage(null);
        setAttachedFile(null);
        
        // Construct detailed message if file is attached
        let finalMessage = userMsg;
        if (currentFile) {
            finalMessage = `[File attached: ${currentFile.name}]\n\nContent:\n${currentFile.text}\n\nUser Question: ${userMsg || "Please summarize or analyze this file."}`;
        }

        setMessages(prev => [...prev, { 
            role: 'user', 
            content: userMsg || (currentFile ? `Shared file: ${currentFile.name}` : "Shared an image"), 
            image: currentImage,
            fileName: currentFile?.name
        }]);

        setIsTyping(true);
        setThinking(true);

        let currentAssistantResponse = "";
        setMessages(prev => [...prev, { role: 'assistant', content: "" }]);

        await streamMessage(finalMessage, "default_session", (chunk) => {
            setThinking(false);
            currentAssistantResponse += chunk;
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { role: 'assistant', content: currentAssistantResponse };
                return newMessages;
            });
        }, currentImage);
        
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
                            {msg.fileName && !msg.image && (
                                <div className="file-attachment-msg">
                                    📄 {msg.fileName}
                                </div>
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
                    {attachedFile && (
                        <div className="image-preview-bubble file-preview">
                            <div className="file-icon">📄</div>
                            <div className="file-info">
                                <span>{attachedFile.name}</span>
                                <small>Ready to analyze</small>
                            </div>
                            <button onClick={() => setAttachedFile(null)}>×</button>
                        </div>
                    )}
                    <div className="input-wrapper">
                        <input 
                            type="file" 
                            accept="image/*, application/pdf, .txt, .js, .py, .html, .css" 
                            style={{ display: 'none' }} 
                            ref={fileInputRef}
                            onChange={handleFileUpload}
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
                        <button type="submit" disabled={isTyping || (!input.trim() && !selectedImage && !attachedFile)}>
                            EXECUTE
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}



