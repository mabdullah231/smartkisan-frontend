import React, { useContext, useState, useRef, useEffect } from "react";
import { Plus, Mic, ArrowRight, Bot, User, ChevronDown, MessageSquare, X } from "lucide-react";
import Helpers from "../../../config/Helpers";
import { DarkModeContext } from "../../DashboardLayout";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import DOMPurify from 'dompurify';


const UserBot = () => {
  const { chatId: paramChatId } = useParams();
  const authUser = Helpers.getAuthUser();
  const darkMode = useContext(DarkModeContext);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentChats, setRecentChats] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showRecentChats, setShowRecentChats] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesEndRefMobile = useRef(null);
  const navigate = useNavigate();
  const chatContainerRef = useRef(null);
  const chatContainerRefMobile = useRef(null);
  const recentChatsRef = useRef(null);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: message,
      sender: "user",
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage("");

    try {
      setIsLoading(true);

      const botId = `bot-${Date.now()}`;
      const botPlaceholder = {
        id: botId,
        text: "",
        sender: "bot",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, botPlaceholder]);

      const authHeaders = Helpers.getAuthHeaders().headers;

      const targetChatId = paramChatId || chatId;
      console.log(paramChatId, chatId);

      // return 
      const shouldCreateNewChat = !targetChatId;
      const url = shouldCreateNewChat
        ? `${Helpers.apiUrl}chat?stream=1`
        : `${Helpers.apiUrl}chat/${targetChatId}?stream=1`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeaders || {})
        },
        body: JSON.stringify({ question: userMessage.text })
      });

      console.log('🔍 Response headers check:');
      console.log('X-Chat-Id:', res.headers.get('X-Chat-Id'));
      console.log('x-chat-id:', res.headers.get('x-chat-id')); // try lowercase
      console.log('X-Chat-Name:', res.headers.get('X-Chat-Name'));
      console.log('All headers:', Array.from(res.headers.entries()));

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || res.statusText);
      }

      // ✅ READ HEADERS IMMEDIATELY
      const responseChatId = res.headers.get('X-Chat-Id');

      // ✅ UPDATE URL IMMEDIATELY FOR NEW CHATS
      if (shouldCreateNewChat && responseChatId) {
        setChatId(responseChatId);
        navigate(`/user/bot/${responseChatId}`, { replace: true });
      }
      // Set chatId state for existing chats
      else if (targetChatId && !chatId) {
        setChatId(targetChatId);
      }

      // NOW start streaming
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value);
          setMessages(prev => prev.map(m =>
            m.id === botId ? { ...m, text: (m.text || "") + chunk } : m
          ));
        }
      }

      // Refresh chat list
      await getRecentChats();

      // Scroll to bottom
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
        if (messagesEndRefMobile.current) {
          messagesEndRefMobile.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);

    } catch (error) {
      console.error(error);
      setMessages(prev => prev.map(m =>
        m.id === botId
          ? { ...m, text: 'Error generating response' }
          : m
      ));
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    if (paramChatId) {
      // Load chat if URL has an ID and it's different from current
      if (String(paramChatId) !== String(chatId)) {
        loadChatById(paramChatId);
        setChatId(paramChatId);
      }
    } else if (chatId !== null) {
      // Only clear if we're moving away from a chat
      setMessages([]);
      setChatId(null);
    }
  }, [paramChatId]);

  const loadChatById = async (id) => {
    try {
      const response = await axios.get(`${Helpers.apiUrl}chat/${id}`, Helpers.getAuthHeaders());
      if (response.data.success) {
        const fullMessages = [];
        response.data.chat.forEach(msg => {
          if (msg.question) fullMessages.push({ id: msg.id + '-q', text: msg.question, sender: 'user' });
          if (msg.answer) fullMessages.push({ id: msg.id + '-a', text: msg.answer, sender: 'bot' });
        });

        setMessages(fullMessages);
        setChatId(id);
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (err) {
      console.error("Failed to load chat:", err);
      Helpers.toast("error", "Failed to load chat");
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setChatId(null);  // Already there, but needs to work with useEffect
    setMessage("")
    navigate(`/user/bot`);
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    if (messagesEndRefMobile.current) {
      messagesEndRefMobile.current.scrollIntoView({ behavior: "smooth" });
    }
    setShowScrollToBottom(false);
  };

  const handleScroll = () => {
    const container = chatContainerRef.current || chatContainerRefMobile.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollToBottom(!isNearBottom);
    }
  };

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
    const container = chatContainerRef.current || chatContainerRefMobile.current;
    if (container && messages.length > 0) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

      if (isNearBottom) {
        requestAnimationFrame(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
          }
          if (messagesEndRefMobile.current) {
            messagesEndRefMobile.current.scrollIntoView({ behavior: "smooth" });
          }
        });
      }
    }
  }, [messages]);

  const getRecentChats = async () => {
    try {
      const response = await axios.get(
        `${Helpers.apiUrl}chats`,
        Helpers.getAuthHeaders()
      );
      setRecentChats(response.data.chats);
    } catch (error) {
      console.log("Error Fetching Recent Chats", error)
      Helpers.toast("error", "Couldn't Fetch Recent Chats")
    }
  }

  useEffect(() => {
    getRecentChats();
  }, []);

  useEffect(() => {
    const desktopContainer = chatContainerRef.current;
    const mobileContainer = chatContainerRefMobile.current;

    if (desktopContainer) {
      desktopContainer.addEventListener('scroll', handleScroll);
      handleScroll();
    }

    if (mobileContainer) {
      mobileContainer.addEventListener('scroll', handleScroll);
      handleScroll();
    }

    return () => {
      if (desktopContainer) {
        desktopContainer.removeEventListener('scroll', handleScroll);
      }
      if (mobileContainer) {
        mobileContainer.removeEventListener('scroll', handleScroll);
      }
    };
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

        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .slim-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(156, 163, 175, 0.4) transparent;
        }

        .slim-scrollbar::-webkit-scrollbar {
          width: 4px;
        }

        .slim-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .slim-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.4);
          border-radius: 2px;
        }

        .slim-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.6);
        }

      `}</style>

      <div className="relative min-h-[calc(100vh-75px)] md:min-h-[calc(100vh-100px)] sm:min-h-[calc(100vh-100px)] flex grow">

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

        <div className="hidden lg:block w-full">
          <div className={`h-full rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 shadow-transition overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex h-full">
              <div className={`w-2/12 p-4 border-r ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
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

                <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-300px)] slim-scrollbar">
                  {recentChats.map((chat) => (
                    <button
                      key={chat.id}
                      className={`w-full text-left py-2 px-3 ${(chat.id == chatId || chat.id == paramChatId) ? 'font-bold' : ''} rounded-lg transition-all duration-200 ${darkMode
                        ? "hover:bg-gray-700 text-gray-300"
                        : "hover:bg-gray-100 text-gray-700"
                        }`}
                      onClick={() => {
                        navigate(`/user/bot/${chat.id}`);
                        loadChatById(chat.id);
                      }}
                    >
                      <span className="text-sm truncate block">
                        {chat.chat_name || "New Chat"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-10/12 relative">
                <div className="h-full px-3 w-full relative">
                  <div
                    ref={chatContainerRef}
                    className="flex-grow px-4 pt-16 pb-20 overflow-y-auto max-h-[calc(100vh-150px)] hide-scrollbar"
                    onScroll={handleScroll}
                  >
                    <div className="space-y-4 mx-auto">
                      {messages.length === 0 && (
                        <div className="h-full flex items-center justify-center">
                          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Start by asking something
                          </p>
                        </div>
                      )}
                      {messages.map((msg, index) => (
                        <div
                          key={msg.id}
                          className={`flex items-start gap-2 animate-fade-in ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                          style={{ alignItems: 'center' }}
                        >
                          {msg.sender === 'bot' && (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${darkMode ? 'bg-green-900' : 'bg-green-100'
                              }`}>
                              <Bot size={16} className={darkMode ? 'text-green-400' : 'text-green-600'} />
                            </div>
                          )}

                          <div className={`max-w-[70%] rounded-2xl px-4 py-3 animate-message-in ${msg.sender === 'user'
                            ? 'rounded-br-none bg-gradient-to-r from-green-600 to-green-500 text-white'
                            : darkMode
                              ? 'bg-gray-700 text-gray-200 rounded-bl-none'
                              : 'bg-gray-100 text-gray-800 rounded-bl-none'
                            }`}>
                            <div
                              className="text-sm leading-relaxed message-content"
                              dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(msg.text || '')
                              }}
                            />
                          </div>

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

                  <div className="absolute bottom-3 z-50 left-0 right-0 px-2 sm:px-4">
                    <div className="max-w-4xl mx-auto relative">
                      <div className={`absolute inset-0 rounded-3xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`} />

                      <div className={`w-full rounded-3xl px-3 py-2 flex items-center gap-3 shadow-lg transition-all duration-300 relative ${darkMode
                        ? 'border border-gray-700'
                        : 'border border-gray-300'
                        }`}>
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

                        <input
                          type="text"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Ask me anything..."
                          className={`flex-1 px-3 py-1.5 rounded-xl border-0 outline-none text-sm transition-all duration-300 transform relative z-10 ${darkMode
                            ? 'bg-gray-700 text-gray-200 placeholder-gray-400 focus:bg-gray-600 focus:scale-[1.02]'
                            : 'bg-white/80 text-gray-800 placeholder-gray-500 focus:bg-white focus:scale-[1.02]'
                            }`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && message.trim()) {
                              handleSendMessage();
                            }
                          }}
                        />

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

        <div className="lg:hidden w-full">
          <div className={`rounded-2xl px-3 w-full h-full shadow-sm hover:shadow-md transition-all duration-300 transform shadow-transition relative ${darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
            <div
              ref={chatContainerRefMobile}
              className="flex-grow px-4 pt-16 pb-20 overflow-y-auto max-h-[calc(100vh-200px)] hide-scrollbar"
              onScroll={handleScroll}
            >
              <div className="space-y-4 mx-auto">
                {messages.length === 0 && (
                  <div className="h-full flex items-center justify-center">
                    <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Start by asking something
                    </p>
                  </div>
                )}
                {messages.map((msg, index) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 animate-fade-in ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    style={{ alignItems: 'center' }}
                  >
                    {msg.sender === 'bot' && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${darkMode ? 'bg-green-900' : 'bg-green-100'
                        }`}>
                        <Bot size={16} className={darkMode ? 'text-green-400' : 'text-green-600'} />
                      </div>
                    )}

                    <div className={`max-w-[70%] rounded-2xl px-4 py-3 animate-message-in ${msg.sender === 'user'
                        ? 'rounded-br-none bg-gradient-to-r from-green-600 to-green-500 text-white'
                        : darkMode
                          ? 'bg-gray-700 text-gray-200 rounded-bl-none'
                          : 'bg-gray-100 text-gray-800 rounded-bl-none'
                      }`}>
                      <div
                        className="text-sm leading-relaxed "
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(msg.text || '')
                        }}
                      />
                    </div>

                    {msg.sender === 'user' && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${darkMode ? 'bg-blue-900' : 'bg-blue-100'
                        }`}>
                        <User size={16} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRefMobile} />
              </div>
            </div>

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

            <div className="absolute bottom-3 z-50 left-0 right-0 px-2 sm:px-4">
              <div className="max-w-4xl mx-auto relative">
                <div className={`absolute inset-0 rounded-3xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`} />

                <div className={`w-full rounded-3xl px-3 py-2 flex items-center gap-3 shadow-lg transition-all duration-300 relative ${darkMode
                  ? 'border border-gray-700'
                  : 'border border-gray-300'
                  }`}>
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

                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask me anything..."
                    className={`flex-1 px-3 py-1.5 rounded-xl border-0 outline-none text-sm transition-all duration-300 transform relative z-10 ${darkMode
                      ? 'bg-gray-700 text-gray-200 placeholder-gray-400 focus:bg-gray-600 focus:scale-[1.02]'
                      : 'bg-white/80 text-gray-800 placeholder-gray-500 focus:bg-white focus:scale-[1.02]'
                      }`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && message.trim()) {
                        handleSendMessage();
                      }
                    }}
                  />

                  <button
                    onClick={handleSendMessage}
                    className={`p-1.5 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95 relative z-10 ${message.trim() && !isLoading
                      ? 'bg-green-600 text-white hover:bg-green-700 shadow-md'
                      : 'bg-green-600 text-white opacity-50 cursor-not-allowed'
                      }`}
                    disabled={!message.trim() || isLoading}
                    aria-label="Send message"
                  >
                    {!isLoading ? <ArrowRight size={18} /> : <span className="inline-block w-5 h-4">...</span>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showRecentChats && (
          <div
            ref={recentChatsRef}
            className="absolute inset-0 z-50 lg:hidden animate-slide-in"
          >
            <div className={`h-full w-64 rounded-l-2xl p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
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

              <div
                className="space-y-2 overflow-y-auto max-h-[calc(100vh-400px)] slim-scrollbar"
              >
                {recentChats.map((chat, index) => (
                  <button
                    key={index}
                    className={`w-full text-left py-2 px-3 ${(chat.id == chatId || chat.id == paramChatId) ? 'font-bold' : ''} rounded-lg transition-all duration-200 ${darkMode
                      ? 'hover:bg-gray-700 text-gray-300'
                      : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    onClick={() => {
                      setShowRecentChats(false);
                      navigate(`/user/bot/${chat.id}`);
                      loadChatById(chat.id);
                    }}
                  >
                    <span className="text-sm truncate block">{chat.chat_name || "New Chat"}</span>
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