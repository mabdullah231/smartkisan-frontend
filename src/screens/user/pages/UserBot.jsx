import React, { useContext, useState, useRef, useEffect } from "react";
import { Plus, Mic, ArrowRight, Bot, User, ChevronDown, MessageSquare, X } from "lucide-react";
import Helpers from "../../../config/Helpers";
import { DarkModeContext } from "../../DashboardLayout";

const UserBot = () => {
  const authUser = Helpers.getAuthUser();
  const darkMode = useContext(DarkModeContext);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date().toISOString()
    }
  ]);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showRecentChats, setShowRecentChats] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const recentChatsRef = useRef(null);

  // Minimal recent chats data
  const recentChats = [
    "Crop Rotation Advice",
    "Weather Forecast",
    "Soil Nutrients",
    "Pest Control",
    "Irrigation System",
  ];

  const handleSendMessage = () => {
    if (!message.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: message,
      sender: "user",
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage("");

    // Simulate bot response
    setTimeout(() => {
      const botResponses = [
        "I understand. Let me help you with that.",
        "Thanks for your question. Here's what I found...",
        "That's a good point. Based on my knowledge...",
        "Let me provide you with some information about that.",
        "I've analyzed your query and here are the details..."
      ];

      const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)];

      const botMessage = {
        id: messages.length + 2,
        text: randomResponse,
        sender: "bot",
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMessage]);
    }, 800);
  };

  const handleNewChat = () => {
    setMessages([{
      id: 1,
      text: "Hello! I'm your AI assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date().toISOString()
    }]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollToBottom(false);
  };

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
      setShowScrollToBottom(isScrolledUp);
    }
  };

  // Close recent chats when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (recentChatsRef.current && !recentChatsRef.current.contains(event.target)) {
        setShowRecentChats(false);
      }
    };

    if (showRecentChats) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showRecentChats]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <>
      <style jsx>{`
        @keyframes messageIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideIn {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .animate-message-in {
          animation: messageIn 0.3s ease-out forwards;
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }

        .animate-slide-in {
          animation: slideIn 0.3s ease-out forwards;
        }

        .shadow-transition {
          transition: box-shadow 0.3s ease;
        }

        /* Hide scrollbar but keep functionality */
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      <div className="relative min-h-[calc(100vh-75px)] md:min-h-[calc(100vh-100px)] sm:min-h-[calc(100vh-100px)] flex grow">
        
        {/* Mobile Recent Chats Toggle Button */}
        <div className="lg:hidden absolute top-4 left-4 z-20">
          <button
            onClick={() => setShowRecentChats(!showRecentChats)}
            className={`p-2 rounded-lg shadow-sm transition-all duration-300 ${darkMode
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                : 'bg-white hover:bg-gray-50 text-gray-600'
              }`}
          >
            <MessageSquare size={20} />
          </button>
        </div>

        {/* Single Unified Card - Desktop */}
        <div className="hidden lg:block w-full">
          <div className={`h-full rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 shadow-transition overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex h-full">
              {/* Recent Chats Sidebar - 2 cols with separator */}
              <div className={`w-2/12 p-4 border-r ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
                {/* Recent Chats Header */}
                <div className="mb-4">
                  <button
                    onClick={handleNewChat}
                    className={`w-full py-2 px-4 rounded-2xl text-sm font-medium transition-all duration-200 ${darkMode
                        ? 'bg-green-700 hover:bg-green-600 text-gray-200'
                        : 'bg-green-600 hover:bg-green-500 text-white'
                      }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Plus size={16} />
                      New Chat
                    </div>
                  </button>
                </div>
                <h2 className={`text-sm font-medium mb-2 ml-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Recent chats
                </h2>

                {/* Recent Chats List */}
                <div className="space-y-2">
                  {recentChats.map((chat, index) => (
                    <button
                      key={index}
                      className={`w-full text-left py-2 px-3 rounded-lg transition-all duration-200 ${darkMode
                          ? 'hover:bg-gray-700 text-gray-300'
                          : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      onClick={() => {
                        console.log('Loading chat:', chat);
                      }}
                    >
                      <span className="text-sm truncate block">{chat}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Chat Area - 10 cols */}
              <div className="w-10/12 relative">
                <div className="h-full px-3 w-full relative">
                  {/* Chat Messages Container */}
                  <div
                    ref={chatContainerRef}
                    className="flex-grow px-4 pt-16 pb-20 overflow-y-auto max-h-[calc(100vh-200px)] hide-scrollbar"
                    onScroll={handleScroll}
                  >
                    <div className="space-y-4 mx-auto">
                      {messages.map((msg, index) => (
                        <div
                          key={msg.id}
                          className={`flex items-start gap-2 animate-fade-in ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                          style={{alignItems: 'center'}}
                        >
                          {/* Bot Avatar */}
                          {msg.sender === 'bot' && (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${darkMode ? 'bg-green-900' : 'bg-green-100'
                              }`}>
                              <Bot size={16} className={darkMode ? 'text-green-400' : 'text-green-600'} />
                            </div>
                          )}

                          {/* Message Bubble */}
                          <div className={`max-w-[70%] rounded-2xl px-4 py-3 animate-message-in ${msg.sender === 'user'
                              ? 'rounded-br-none bg-gradient-to-r from-green-600 to-green-500 text-white'
                              : darkMode
                                ? 'bg-gray-700 text-gray-200 rounded-bl-none'
                                : 'bg-gray-100 text-gray-800 rounded-bl-none'
                            }`}>
                            <p className="text-sm leading-relaxed">
                              {msg.text}
                            </p>
                          </div>

                          {/* User Avatar */}
                          {msg.sender === 'user' && (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${darkMode ? 'bg-blue-900' : 'bg-blue-100'
                              }`}>
                              <User size={16} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
                            </div>
                          )}
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {/* Scroll to Bottom Button */}
                  {showScrollToBottom && (
                    <button
                      onClick={scrollToBottom}
                      className={`fixed bottom-28 md:bottom-24 right-4 md:right-6 p-2 md:p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50 ${darkMode
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      aria-label="Scroll to bottom"
                    >
                      <ChevronDown size={18} />
                    </button>
                  )}

                  {/* Chatbot Interface - Fixed at bottom */}
                  <div className="absolute bottom-3 z-50 left-0 right-0 px-2 sm:px-4">
                    <div className="max-w-4xl mx-auto relative">
                      {/* Background overlay */}
                      <div className={`absolute inset-0 rounded-3xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`} />

                      <div className={`w-full rounded-3xl px-3 py-2 flex items-center gap-3 shadow-lg transition-all duration-300 relative ${darkMode
                          ? 'border border-gray-700'
                          : 'border border-gray-300'
                        }`}>
                        {/* Left Side - Action Buttons */}
                        <div className="flex items-center gap-2 relative z-10">
                          <button
                            className="p-1.5 transition-all duration-200 text-green-600 hover:text-green-700 transform hover:scale-110"
                            aria-label="Add attachment"
                          >
                            <Plus size={18} />
                          </button>
                          <button
                            className="p-1.5 transition-all duration-200 text-green-600 hover:text-green-700 transform hover:scale-110"
                            aria-label="Voice input"
                          >
                            <Mic size={18} />
                          </button>
                        </div>

                        {/* Text Input Area */}
                        <input
                          type="text"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Ask me anything..."
                          className={`flex-1 px-3 py-1.5 rounded-xl border-0 outline-none text-sm transition-all duration-300 transform relative z-10 ${darkMode
                              ? 'bg-gray-700 text-gray-200 placeholder-gray-400 focus:bg-gray-600 focus:scale-[1.02]'
                              : 'bg-white/80 text-gray-800 placeholder-gray-500 focus:bg-white focus:scale-[1.02]'
                            }`}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && message.trim()) {
                              handleSendMessage();
                            }
                          }}
                        />

                        {/* Right Side - Send Button */}
                        <button
                          onClick={handleSendMessage}
                          className={`p-1.5 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95 relative z-10 ${message.trim()
                              ? 'bg-green-600 text-white hover:bg-green-700 shadow-md'
                              : 'bg-green-600 text-white opacity-50 cursor-not-allowed'
                            }`}
                          disabled={!message.trim()}
                          aria-label="Send message"
                        >
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile View - Separate Card */}
        <div className="lg:hidden w-full">
          <div className={`rounded-2xl px-3 w-full h-full shadow-sm hover:shadow-md transition-all duration-300 transform shadow-transition relative ${darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
            {/* Chat Messages Container */}
            <div
              ref={chatContainerRef}
              className="flex-grow px-4 pt-16 pb-20 overflow-y-auto max-h-[calc(100vh-200px)] hide-scrollbar"
              onScroll={handleScroll}
            >
              <div className="space-y-4 mx-auto">
                {messages.map((msg, index) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 animate-fade-in ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    style={{alignItems: 'center'}}
                  >
                    {/* Bot Avatar */}
                    {msg.sender === 'bot' && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${darkMode ? 'bg-green-900' : 'bg-green-100'
                        }`}>
                        <Bot size={16} className={darkMode ? 'text-green-400' : 'text-green-600'} />
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div className={`max-w-[70%] rounded-2xl px-4 py-3 animate-message-in ${msg.sender === 'user'
                        ? 'rounded-br-none bg-gradient-to-r from-green-600 to-green-500 text-white'
                        : darkMode
                          ? 'bg-gray-700 text-gray-200 rounded-bl-none'
                          : 'bg-gray-100 text-gray-800 rounded-bl-none'
                      }`}>
                      <p className="text-sm leading-relaxed">
                        {msg.text}
                      </p>
                    </div>

                    {/* User Avatar */}
                    {msg.sender === 'user' && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${darkMode ? 'bg-blue-900' : 'bg-blue-100'
                        }`}>
                        <User size={16} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Scroll to Bottom Button */}
            {showScrollToBottom && (
              <button
                onClick={scrollToBottom}
                className={`fixed bottom-28 md:bottom-24 right-4 md:right-6 p-2 md:p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50 ${darkMode
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                aria-label="Scroll to bottom"
              >
                <ChevronDown size={18} />
              </button>
            )}

            {/* Chatbot Interface - Fixed at bottom */}
            <div className="absolute bottom-3 z-50 left-0 right-0 px-2 sm:px-4">
              <div className="max-w-4xl mx-auto relative">
                {/* Background overlay */}
                <div className={`absolute inset-0 rounded-3xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`} />

                <div className={`w-full rounded-3xl px-3 py-2 flex items-center gap-3 shadow-lg transition-all duration-300 relative ${darkMode
                    ? 'border border-gray-700'
                    : 'border border-gray-300'
                  }`}>
                  {/* Left Side - Action Buttons */}
                  <div className="flex items-center gap-2 relative z-10">
                    <button
                      className="p-1.5 transition-all duration-200 text-green-600 hover:text-green-700 transform hover:scale-110"
                      aria-label="Add attachment"
                    >
                      <Plus size={18} />
                    </button>
                    <button
                      className="p-1.5 transition-all duration-200 text-green-600 hover:text-green-700 transform hover:scale-110"
                      aria-label="Voice input"
                    >
                      <Mic size={18} />
                    </button>
                  </div>

                  {/* Text Input Area */}
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask me anything..."
                    className={`flex-1 px-3 py-1.5 rounded-xl border-0 outline-none text-sm transition-all duration-300 transform relative z-10 ${darkMode
                        ? 'bg-gray-700 text-gray-200 placeholder-gray-400 focus:bg-gray-600 focus:scale-[1.02]'
                        : 'bg-white/80 text-gray-800 placeholder-gray-500 focus:bg-white focus:scale-[1.02]'
                      }`}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && message.trim()) {
                        handleSendMessage();
                      }
                    }}
                  />

                  {/* Right Side - Send Button */}
                  <button
                    onClick={handleSendMessage}
                    className={`p-1.5 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95 relative z-10 ${message.trim()
                        ? 'bg-green-600 text-white hover:bg-green-700 shadow-md'
                        : 'bg-green-600 text-white opacity-50 cursor-not-allowed'
                      }`}
                    disabled={!message.trim()}
                    aria-label="Send message"
                  >
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Recent Chats Sidebar */}
        {showRecentChats && (
          <div 
            ref={recentChatsRef}
            className="absolute inset-0 z-50 lg:hidden animate-slide-in"
          >
            <div className={`h-full w-64 rounded-l-2xl p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              {/* Mobile Recent Chats Header with Close Button */}
              <div className="mb-4 flex items-center justify-between">
                <button
                  onClick={() => setShowRecentChats(false)}
                  className={`p-2 rounded-lg ${darkMode
                      ? 'hover:bg-gray-700 text-gray-300'
                      : 'hover:bg-gray-100 text-gray-600'
                    }`}
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="mb-4">
                <button
                  onClick={() => {
                    handleNewChat();
                    setShowRecentChats(false);
                  }}
                  className={`w-full py-2 px-6 rounded-2xl text-sm font-medium transition-all duration-200 ${darkMode
                      ? 'bg-green-700 hover:bg-green-600 text-gray-200'
                      : 'bg-green-600 hover:bg-green-500 text-white'
                    }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Plus size={16} />
                    New Chat
                  </div>
                </button>
              </div>
              
              <h2 className={`text-sm mb-2 ml-1 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Recent chats
              </h2>

              {/* Mobile Recent Chats List */}
              <div className="space-y-2">
                {recentChats.map((chat, index) => (
                  <button
                    key={index}
                    className={`w-full text-left py-2 px-3 rounded-lg transition-all duration-200 ${darkMode
                        ? 'hover:bg-gray-700 text-gray-300'
                        : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    onClick={() => {
                      setShowRecentChats(false);
                      console.log('Loading chat:', chat);
                    }}
                  >
                    <span className="text-sm truncate block">{chat}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UserBot;