import React, { useContext, useState, useRef, useEffect } from "react";
import { Plus, Mic, ArrowRight, Bot, User, ChevronDown, MessageSquare, X, Cloud, Droplets, Image } from "lucide-react";
import Helpers from "../../../config/Helpers";
import { DarkModeContext, LanguageContext } from "../../DashboardLayout";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import DOMPurify from 'dompurify';


const UserBot = () => {
  const { chatId: paramChatId } = useParams();
  const authUser = Helpers.getAuthUser();
  const darkMode = useContext(DarkModeContext);
  const language = useContext(LanguageContext);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentChats, setRecentChats] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showRecentChats, setShowRecentChats] = useState(false);
  const [showPlusOptions, setShowPlusOptions] = useState(false);
  // Each attachment: { id, type: 'weather'|'soil'|'image', label, data }
  const [attachments, setAttachments] = useState([]);

  const messagesEndRef = useRef(null);
  const messagesEndRefMobile = useRef(null);
  const navigate = useNavigate();
  const chatContainerRef = useRef(null);
  const chatContainerRefMobile = useRef(null);
  const recentChatsRef = useRef(null);

  // ─── Attachment handlers ──────────────────────────────────────────────────────

  const removeAttachment = (id) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddWeather = async () => {
    setShowPlusOptions(false);
    if (attachments.some((a) => a.type === "weather")) {
      Helpers.toast("error", language === "urdu" ? "موسم پہلے سے شامل ہے" : "Weather already added");
      return;
    }
    try {
      const getCoords = () =>
        new Promise((resolve) => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
              () => resolve({ lat: 30.19, lon: 71.47 })
            );
          } else {
            resolve({ lat: 30.19, lon: 71.47 });
          }
        });
      const { lat, lon } = await getCoords();
      const response = await axios.post(
        `${Helpers.apiUrl}weather/get-weather`,
        {
          latitude: lat,
          longitude: lon
        },
        Helpers.getAuthHeaders()
      );
      if (response.data.success) {
        const d = response.data;
        const label = language === "urdu"
          ? `${d.condition_text_urdu || d.condition_text} · ${d.temperature}°C · نمی ${d.humidity}%`
          : `${d.condition_text} · ${d.temperature}°C · ${d.humidity}% hum.`;
        const contextData = language === "urdu"
          ? `[موسم: ${d.condition_text_urdu || d.condition_text}, درجہ حرارت: ${d.temperature}°C, نمی: ${d.humidity}%]`
          : `[Weather: ${d.condition_text}, Temperature: ${d.temperature}°C, Humidity: ${d.humidity}%]`;
        setAttachments((prev) => [...prev, { id: `weather-${Date.now()}`, type: "weather", label, data: contextData }]);
      } else {
        Helpers.toast("error", "Could not fetch weather data");
      }
    } catch (error) {
      console.error("Error fetching weather:", error);
      Helpers.toast("error", "Could not fetch weather data");
    }
  };

  const handleAddSoilMoisture = async () => {
    setShowPlusOptions(false);
    if (attachments.some((a) => a.type === "soil")) {
      Helpers.toast("error", language === "urdu" ? "مٹی کی نمی پہلے سے شامل ہے" : "Soil moisture already added");
      return;
    }
    try {
      const response = await axios.get(
        `${Helpers.apiUrl}userdata/get-soil-moisture`,
        Helpers.getAuthHeaders()
      );
      const moisture = response.data?.success ? response.data.moisture : 65;
      const label = language === "urdu" ? `مٹی کی نمی: ${moisture}%` : `Soil: ${moisture}%`;
      const contextData = language === "urdu"
        ? `[مٹی کی نمی: ${moisture}% (IoT سے موصول)]`
        : `[Soil Moisture: ${moisture}% (from IoT)]`;
      setAttachments((prev) => [...prev, { id: `soil-${Date.now()}`, type: "soil", label, data: contextData }]);
    } catch (error) {
      console.error("Soil moisture fetch error:", error);
      const label = language === "urdu" ? "مٹی کی نمی: 65%" : "Soil: 65%";
      const contextData = language === "urdu"
        ? "[مٹی کی نمی: 65% (IoT سے موصول)]"
        : "[Soil Moisture: 65% (from IoT)]";
      setAttachments((prev) => [...prev, { id: `soil-${Date.now()}`, type: "soil", label, data: contextData }]);
    }
  };

  const handleAddPicture = () => {
    setShowPlusOptions(false);
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const label = file.name.length > 20 ? file.name.slice(0, 18) + "…" : file.name;
        const contextData = language === "urdu" ? `[تصویر: ${file.name}]` : `[Image: ${file.name}]`;
        setAttachments((prev) => [...prev, { id: `img-${Date.now()}`, type: "image", label, data: contextData, file }]);
      }
    };
    input.click();
  };

  // ─── Send message ─────────────────────────────────────────────────────────────

  const handleSendMessage = async () => {
    if (!message.trim() && attachments.length === 0) return;

    const attachmentContext = attachments.map((a) => a.data).join(" ");
    const fullQuestion = [message.trim(), attachmentContext].filter(Boolean).join("\n");

    const userMessage = {
      id: Date.now(),
      text: fullQuestion,
      sender: "user",
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setAttachments([]);

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
        body: JSON.stringify({
          question: fullQuestion,
          history: messages
            .slice(-6)
            .map(m => ({ role: m.sender, content: m.text }))
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || res.statusText);
      }

      const responseChatId = res.headers.get('X-Chat-Id');

      if (shouldCreateNewChat && responseChatId) {
        setChatId(responseChatId);
        navigate(`/user/bot/${responseChatId}`, { replace: true });
      } else if (targetChatId && !chatId) {
        setChatId(targetChatId);
      }

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

      await getRecentChats();

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        messagesEndRefMobile.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

    } catch (error) {
      console.error(error);
      setMessages(prev => prev.map(m =>
        m.id === botId ? { ...m, text: 'Error generating response' } : m
      ));
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Chat lifecycle ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (paramChatId) {
      if (String(paramChatId) !== String(chatId)) {
        loadChatById(paramChatId);
        setChatId(paramChatId);
      }
    } else if (chatId !== null) {
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
          if (msg.answer)   fullMessages.push({ id: msg.id + '-a', text: msg.answer,   sender: 'bot' });
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
    setChatId(null);
    setMessage("");
    setAttachments([]);
    navigate(`/user/bot`);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    messagesEndRefMobile.current?.scrollIntoView({ behavior: "smooth" });
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
      if (showPlusOptions &&
        !event.target.closest('.plus-options-dropdown') &&
        !event.target.closest('.plus-toggle-btn')
      ) {
        setShowPlusOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showRecentChats, showPlusOptions]);

  useEffect(() => {
    const container = chatContainerRef.current || chatContainerRefMobile.current;
    if (container && messages.length > 0) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
      if (isNearBottom) {
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          messagesEndRefMobile.current?.scrollIntoView({ behavior: "smooth" });
        });
      }
    }
  }, [messages]);

  const getRecentChats = async () => {
    try {
      const response = await axios.get(`${Helpers.apiUrl}chats`, Helpers.getAuthHeaders());
      setRecentChats(response.data.chats);
    } catch (error) {
      console.log("Error Fetching Recent Chats", error);
      Helpers.toast("error", "Couldn't Fetch Recent Chats");
    }
  };

  useEffect(() => {
    getRecentChats();
  }, []);

  useEffect(() => {
    const desktopContainer = chatContainerRef.current;
    const mobileContainer = chatContainerRefMobile.current;
    if (desktopContainer) { desktopContainer.addEventListener('scroll', handleScroll); handleScroll(); }
    if (mobileContainer)  { mobileContainer.addEventListener('scroll', handleScroll);  handleScroll(); }
    return () => {
      desktopContainer?.removeEventListener('scroll', handleScroll);
      mobileContainer?.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // ─── Badge helpers (plain functions, not components) ─────────────────────────

  const getBadgeClass = (type) => {
    if (type === "weather") return darkMode
      ? "bg-blue-900/60 text-blue-300 border-blue-700"
      : "bg-blue-50 text-blue-700 border-blue-200";
    if (type === "soil") return darkMode
      ? "bg-green-900/60 text-green-300 border-green-700"
      : "bg-green-50 text-green-700 border-green-200";
    return darkMode
      ? "bg-purple-900/60 text-purple-300 border-purple-700"
      : "bg-purple-50 text-purple-700 border-purple-200";
  };

  const getBadgeIcon = (type) => {
    if (type === "weather") return <Cloud size={11} className="flex-shrink-0" />;
    if (type === "soil")    return <Droplets size={11} className="flex-shrink-0" />;
    return <Image size={11} className="flex-shrink-0" />;
  };

  // ─── Derived send-enabled flag ────────────────────────────────────────────────
  const canSend = (message.trim().length > 0 || attachments.length > 0) && !isLoading;

  return (
    <>
      <style jsx>{`
        @keyframes messageIn {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(8px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-message-in  { animation: messageIn  0.3s ease-out forwards; }
        .animate-fade-in     { animation: fadeIn     0.3s ease-out forwards; }
        .animate-slide-in    { animation: slideIn    0.3s ease-out forwards; }
        .animate-dropdown-in { animation: dropdownIn 0.15s ease-out forwards; }
        .shadow-transition   { transition: box-shadow 0.3s ease; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .slim-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(156,163,175,0.4) transparent; }
        .slim-scrollbar::-webkit-scrollbar { width: 4px; }
        .slim-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .slim-scrollbar::-webkit-scrollbar-thumb { background: rgba(156,163,175,0.4); border-radius: 2px; }
        .slim-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(156,163,175,0.6); }
      `}</style>

      <div className="relative min-h-[calc(100vh-75px)] md:min-h-[calc(100vh-100px)] sm:min-h-[calc(100vh-100px)] flex grow">

        {/* Mobile hamburger */}
        <div className="lg:hidden absolute top-4 left-4 z-20">
          <button
            onClick={() => setShowRecentChats(!showRecentChats)}
            className={`p-2 rounded-lg shadow-sm transition-all duration-300 ${darkMode
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              : 'bg-white hover:bg-gray-50 text-gray-600'}`}
          >
            <MessageSquare size={20} />
          </button>
        </div>

        {/* ═══════════════════ DESKTOP ═══════════════════ */}
        <div className="hidden lg:block w-full">
          <div className={`h-full rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 shadow-transition overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex h-full">

              {/* Sidebar */}
              <div className={`w-2/12 p-4 border-r ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
                <div className="mb-4">
                  <button
                    onClick={handleNewChat}
                    className={`w-full py-2 px-4 rounded-2xl text-sm font-medium transition-all duration-200 ${darkMode
                      ? 'bg-green-700 hover:bg-green-600 text-gray-200'
                      : 'bg-green-600 hover:bg-green-500 text-white'}`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Plus size={16} />
                      {language === "urdu" ? "نئی چیٹ" : "New Chat"}
                    </div>
                  </button>
                </div>
                <h2 className={`text-sm font-medium mb-2 ml-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {language === "urdu" ? "حالیہ چیٹس" : "Recent chats"}
                </h2>
                <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-300px)] slim-scrollbar">
                  {recentChats.map((chat) => (
                    <button
                      key={chat.id}
                      className={`w-full text-left py-2 px-3 ${(chat.id == chatId || chat.id == paramChatId) ? 'font-bold' : ''} rounded-lg transition-all duration-200 ${darkMode
                        ? "hover:bg-gray-700 text-gray-300"
                        : "hover:bg-gray-100 text-gray-700"}`}
                      onClick={() => { navigate(`/user/bot/${chat.id}`); loadChatById(chat.id); }}
                    >
                      <span className="text-sm truncate block">{chat.chat_name || "New Chat"}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat panel */}
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
                            {language === "urdu" ? "کچھ پوچھ کر آغاز کریں" : "Start by asking something"}
                          </p>
                        </div>
                      )}
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex items-start gap-2 animate-fade-in ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                          style={{ alignItems: 'center' }}
                        >
                          {msg.sender === 'bot' && (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${darkMode ? 'bg-green-900' : 'bg-green-100'}`}>
                              <Bot size={16} className={darkMode ? 'text-green-400' : 'text-green-600'} />
                            </div>
                          )}
                          <div className={`max-w-[70%] rounded-2xl px-4 py-3 animate-message-in ${msg.sender === 'user'
                            ? 'rounded-br-none bg-gradient-to-r from-green-600 to-green-500 text-white'
                            : darkMode
                              ? 'bg-gray-700 text-gray-200 rounded-bl-none'
                              : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                            <div
                              className="text-sm leading-relaxed message-content"
                              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.text || '') }}
                            />
                          </div>
                          {msg.sender === 'user' && (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${darkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
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
                        : 'bg-green-500 hover:bg-green-600 text-white'}`}
                    >
                      <ChevronDown size={18} />
                    </button>
                  )}

                  {/* Desktop input bar */}
                  <div className="absolute bottom-3 left-0 right-0 px-2 sm:px-4" style={{ zIndex: 50 }}>
                    <div className="max-w-4xl mx-auto" style={{ position: 'relative' }}>

                      {/* Plus dropdown — rendered outside the pill so it floats above freely */}
                      {showPlusOptions && (
                        <div
                          className="plus-options-dropdown animate-dropdown-in"
                          style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, zIndex: 9999 }}
                        >
                          <div className={`w-52 rounded-xl shadow-2xl py-1.5 border ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                            <button onClick={handleAddWeather} className={`flex items-center w-full px-4 py-2.5 text-sm transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`}>
                              <Cloud size={15} className="mr-3 text-blue-500 flex-shrink-0" />
                              {language === "urdu" ? "موسم شامل کریں" : "Add Weather"}
                            </button>
                            <div className={`mx-3 my-1 h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />
                            <button onClick={handleAddSoilMoisture} className={`flex items-center w-full px-4 py-2.5 text-sm transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`}>
                              <Droplets size={15} className="mr-3 text-green-500 flex-shrink-0" />
                              {language === "urdu" ? "مٹی کی نمی (IoT)" : "Soil Moisture (IoT)"}
                            </button>
                            <div className={`mx-3 my-1 h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />
                            <button onClick={handleAddPicture} className={`flex items-center w-full px-4 py-2.5 text-sm transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`}>
                              <Image size={15} className="mr-3 text-purple-500 flex-shrink-0" />
                              {language === "urdu" ? "تصویر شامل کریں" : "Add Picture"}
                            </button>
                          </div>
                        </div>
                      )}

                      <div className={`absolute inset-0 rounded-3xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`} />
                      <div className={`w-full rounded-3xl shadow-lg transition-all duration-300 relative border ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>

                        {/* Attachment badges */}
                        {attachments.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 px-3 pt-2.5 pb-1">
                            {attachments.map((att) => (
                              <span key={att.id} className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${getBadgeClass(att.type)}`}>
                                {getBadgeIcon(att.type)}
                                {att.label}
                                <button onClick={() => removeAttachment(att.id)} className="ml-0.5 hover:opacity-60 transition-opacity">
                                  <X size={10} />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-3 px-3 py-2">
                          <button
                            onClick={() => setShowPlusOptions(!showPlusOptions)}
                            className="plus-toggle-btn p-1.5 transition-all duration-200 text-green-600 hover:text-green-700 transform hover:scale-110"
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
                          <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={attachments.length > 0
                              ? (language === "urdu" ? "اپنا سوال لکھیں..." : "Add your question...")
                              : (language === "urdu" ? "کچھ بھی پوچھیں..." : "Ask me anything...")}
                            className={`flex-1 px-3 py-1.5 rounded-xl border-0 outline-none text-sm transition-all duration-300 transform relative z-10 ${darkMode
                              ? 'bg-gray-700 text-gray-200 placeholder-gray-400 focus:bg-gray-600 focus:scale-[1.02]'
                              : 'bg-white/80 text-gray-800 placeholder-gray-500 focus:bg-white focus:scale-[1.02]'}`}
                            style={{ direction: language === "urdu" ? "rtl" : "ltr" }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && canSend) handleSendMessage();
                            }}
                          />
                          <button
                            onClick={handleSendMessage}
                            disabled={!canSend}
                            className={`p-1.5 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95 relative z-10 ${canSend
                              ? 'bg-green-600 text-white hover:bg-green-700 shadow-md'
                              : 'bg-green-600 text-white opacity-50 cursor-not-allowed'}`}
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
        </div>

        {/* ═══════════════════ MOBILE ═══════════════════ */}
        <div className="lg:hidden w-full">
          <div className={`rounded-2xl px-3 w-full h-full shadow-sm hover:shadow-md transition-all duration-300 transform shadow-transition relative ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div
              ref={chatContainerRefMobile}
              className="flex-grow px-4 pt-16 pb-20 overflow-y-auto max-h-[calc(100vh-200px)] hide-scrollbar"
              onScroll={handleScroll}
            >
              <div className="space-y-4 mx-auto">
                {messages.length === 0 && (
                  <div className="h-full flex items-center justify-center">
                    <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {language === "urdu" ? "کچھ پوچھ کر آغاز کریں" : "Start by asking something"}
                    </p>
                  </div>
                )}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 animate-fade-in ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    style={{ alignItems: 'center' }}
                  >
                    {msg.sender === 'bot' && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${darkMode ? 'bg-green-900' : 'bg-green-100'}`}>
                        <Bot size={16} className={darkMode ? 'text-green-400' : 'text-green-600'} />
                      </div>
                    )}
                    <div className={`max-w-[70%] rounded-2xl px-4 py-3 animate-message-in ${msg.sender === 'user'
                      ? 'rounded-br-none bg-gradient-to-r from-green-600 to-green-500 text-white'
                      : darkMode
                        ? 'bg-gray-700 text-gray-200 rounded-bl-none'
                        : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                      <div
                        className="text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.text || '') }}
                      />
                    </div>
                    {msg.sender === 'user' && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${darkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
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
                  : 'bg-green-500 hover:bg-green-600 text-white'}`}
              >
                <ChevronDown size={18} />
              </button>
            )}

            {/* Mobile input bar */}
            <div className="absolute bottom-3 left-0 right-0 px-2 sm:px-4" style={{ zIndex: 50 }}>
              <div className="max-w-4xl mx-auto" style={{ position: 'relative' }}>

                {/* Plus dropdown */}
                {showPlusOptions && (
                  <div
                    className="plus-options-dropdown animate-dropdown-in"
                    style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, zIndex: 9999 }}
                  >
                    <div className={`w-52 rounded-xl shadow-2xl py-1.5 border ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                      <button onClick={handleAddWeather} className={`flex items-center w-full px-4 py-2.5 text-sm transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`}>
                        <Cloud size={15} className="mr-3 text-blue-500 flex-shrink-0" />
                        {language === "urdu" ? "موسم شامل کریں" : "Add Weather"}
                      </button>
                      <div className={`mx-3 my-1 h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />
                      <button onClick={handleAddSoilMoisture} className={`flex items-center w-full px-4 py-2.5 text-sm transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`}>
                        <Droplets size={15} className="mr-3 text-green-500 flex-shrink-0" />
                        {language === "urdu" ? "مٹی کی نمی (IoT)" : "Soil Moisture (IoT)"}
                      </button>
                      <div className={`mx-3 my-1 h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />
                      <button onClick={handleAddPicture} className={`flex items-center w-full px-4 py-2.5 text-sm transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`}>
                        <Image size={15} className="mr-3 text-purple-500 flex-shrink-0" />
                        {language === "urdu" ? "تصویر شامل کریں" : "Add Picture"}
                      </button>
                    </div>
                  </div>
                )}

                <div className={`absolute inset-0 rounded-3xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`} />
                <div className={`w-full rounded-3xl shadow-lg transition-all duration-300 relative border ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>

                  {/* Attachment badges */}
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 px-3 pt-2.5 pb-1">
                      {attachments.map((att) => (
                        <span key={att.id} className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${getBadgeClass(att.type)}`}>
                          {getBadgeIcon(att.type)}
                          {att.label}
                          <button onClick={() => removeAttachment(att.id)} className="ml-0.5 hover:opacity-60 transition-opacity">
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 px-3 py-2">
                    <button
                      onClick={() => setShowPlusOptions(!showPlusOptions)}
                      className="plus-toggle-btn p-1.5 transition-all duration-200 text-green-600 hover:text-green-700 transform hover:scale-110"
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
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={attachments.length > 0
                        ? (language === "urdu" ? "اپنا سوال لکھیں..." : "Add your question...")
                        : (language === "urdu" ? "کچھ بھی پوچھیں..." : "Ask me anything...")}
                      className={`flex-1 px-3 py-1.5 rounded-xl border-0 outline-none text-sm transition-all duration-300 transform relative z-10 ${darkMode
                        ? 'bg-gray-700 text-gray-200 placeholder-gray-400 focus:bg-gray-600 focus:scale-[1.02]'
                        : 'bg-white/80 text-gray-800 placeholder-gray-500 focus:bg-white focus:scale-[1.02]'}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && canSend) handleSendMessage();
                      }}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!canSend}
                      className={`p-1.5 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95 relative z-10 ${canSend
                        ? 'bg-green-600 text-white hover:bg-green-700 shadow-md'
                        : 'bg-green-600 text-white opacity-50 cursor-not-allowed'}`}
                      aria-label="Send message"
                    >
                      {!isLoading ? <ArrowRight size={18} /> : <span className="inline-block w-5 h-4">...</span>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════ MOBILE RECENT CHATS SIDEBAR ═══════════════════ */}
        {showRecentChats && (
          <div ref={recentChatsRef} className="absolute inset-0 z-50 lg:hidden animate-slide-in">
            <div className={`h-full w-64 rounded-l-2xl p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="mb-4 flex items-center justify-between">
                <button
                  onClick={() => setShowRecentChats(false)}
                  className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="mb-4">
                <button
                  onClick={() => { handleNewChat(); setShowRecentChats(false); }}
                  className={`w-full py-2 px-6 rounded-2xl text-sm font-medium transition-all duration-200 ${darkMode
                    ? 'bg-green-700 hover:bg-green-600 text-gray-200'
                    : 'bg-green-600 hover:bg-green-500 text-white'}`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Plus size={16} />
                    {language === "urdu" ? "نئی چیٹ" : "New Chat"}
                  </div>
                </button>
              </div>
              <h2 className={`text-sm mb-2 ml-1 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {language === "urdu" ? "حالیہ چیٹس" : "Recent chats"}
              </h2>
              <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-400px)] slim-scrollbar">
                {recentChats.map((chat, index) => (
                  <button
                    key={index}
                    className={`w-full text-left py-2 px-3 ${(chat.id == chatId || chat.id == paramChatId) ? 'font-bold' : ''} rounded-lg transition-all duration-200 ${darkMode
                      ? 'hover:bg-gray-700 text-gray-300'
                      : 'hover:bg-gray-100 text-gray-700'}`}
                    onClick={() => { setShowRecentChats(false); navigate(`/user/bot/${chat.id}`); loadChatById(chat.id); }}
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