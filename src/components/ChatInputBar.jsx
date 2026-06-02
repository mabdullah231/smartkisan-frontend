import React, { useContext, useState } from "react";
import { Plus, Mic, ArrowRight, Cloud, Droplets, Image, X } from "lucide-react";
import { DarkModeContext, LanguageContext } from "../screens/DashboardLayout";
import axios from "axios";
import { useAudioHandlers } from "../hooks/useAudioHandlers";
import Helpers from "../config/Helpers";
import ImageClassificationModal from "./ImageClassificationModal";

/**
 * ChatInputBar - Reusable chat input component with attachments and STT
 * 
 * Props:
 * - onSendMessage: callback(message, attachments) when send is clicked
 * - isNavigating: if true, clears message/attachments after send (for Dashboard)
 * - showMicButton: if true, shows microphone button (default: true)
 */
const ChatInputBar = ({ onSendMessage, isNavigating = false, showMicButton = true }) => {
  const darkMode = useContext(DarkModeContext);
  const language = useContext(LanguageContext);

  const [message, setMessage] = useState("");
  const [showPlusOptions, setShowPlusOptions] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [classificationResult, setClassificationResult] = useState(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [imageError, setImageError] = useState(null);

  const { isListening, handleStartListening } = useAudioHandlers(
    language,
    (text) => setMessage(prev => prev + text + ' ')
  );

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
      const response = await axios.get(`${Helpers.apiUrl}iot/status`, Helpers.getAuthHeaders());
      let statusValue;
      if (response.data.success && response.data.data?.status) {
        statusValue = response.data.data.status;
      } else {
        statusValue = language === "urdu" ? "ڈیٹا دستیاب نہیں" : "Data not available";
      }
      const label = language === "urdu" ? `مٹی کی نمی: ${statusValue}` : `Soil: ${statusValue}`;
      const contextData = language === "urdu"
        ? `[مٹی کی نمی: ${statusValue} (IoT سے موصول)]`
        : `[Soil Moisture: ${statusValue} (from IoT)]`;
      setAttachments((prev) => [...prev, { id: `soil-${Date.now()}`, type: "soil", label, data: contextData }]);
    } catch (error) {
      console.error("Soil moisture fetch error:", error);
      let errorMsg;
      if (error.response?.status === 404 && error.response?.data?.detail === "IoT device URL not configured") {
        errorMsg = language === "urdu" ? "IoT ڈیوائس یو آر ایل کنفیگر نہیں کیا گیا" : "IoT device URL not configured";
      } else {
        errorMsg = language === "urdu" ? "مٹی کی نمی حاصل کرنے میں خرابی" : "Error fetching soil moisture";
      }
      const label = language === "urdu" ? `مٹی کی نمی: ${errorMsg}` : `Soil: ${errorMsg}`;
      const contextData = language === "urdu"
        ? `[مٹی کی نمی: ${errorMsg} (IoT سے موصول)]`
        : `[Soil Moisture: ${errorMsg} (from IoT)]`;
      setAttachments((prev) => [...prev, { id: `soil-${Date.now()}`, type: "soil", label, data: contextData }]);
    }
  };

  const resetImageModal = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setSelectedImage(null);
    setImagePreviewUrl(null);
    setClassificationResult(null);
    setImageError(null);
    setIsClassifying(false);
  };

  const handleAddPicture = () => {
    setShowPlusOptions(false);
    resetImageModal();
    setShowImageModal(true);
  };

  const handleCloseImageModal = () => {
    setShowImageModal(false);
    resetImageModal();
  };

  const handleImageFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      Helpers.toast("error", language === "urdu" ? "براہ کرم ایک تصویر منتخب کریں" : "Please select an image file");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setSelectedImage(file);
    setImagePreviewUrl(previewUrl);
    setClassificationResult(null);
    setImageError(null);
    await classifyImage(file);
  };

  const classifyImage = async (file) => {
    setIsClassifying(true);
    setImageError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await axios.post(
        `${Helpers.apiUrl}classify-wheat-image`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        setClassificationResult({
          label: response.data.label,
          accuracy: response.data.accuracy,
        });
      } else {
        setImageError(language === "urdu" ? "تصویر کی درجہ بندی ناکام" : "Image classification failed");
      }
    } catch (error) {
      console.error("Image classification error:", error);
      const detail = error.response?.data?.detail;
      setImageError(detail || (language === "urdu" ? "تصویر کی درجہ بندی ناکام" : "Image classification failed"));
    } finally {
      setIsClassifying(false);
    }
  };

  const handleClearImage = () => {
    resetImageModal();
  };

  const handleAddClassificationToChat = () => {
    if (!classificationResult) return;

    const label = language === "urdu"
      ? `بیماری: ${classificationResult.label} (${classificationResult.accuracy}%)`
      : `Disease: ${classificationResult.label} (${classificationResult.accuracy}%)`;
    const contextData = language === "urdu"
      ? `[گندم کی بیماری: ${classificationResult.label}, درستگی: ${classificationResult.accuracy}%]`
      : `[Wheat Disease: ${classificationResult.label}, Accuracy: ${classificationResult.accuracy}%]`;

    setAttachments((prev) => [...prev, {
      id: `disease-${Date.now()}`,
      type: "disease",
      label,
      data: contextData
    }]);
    
    setShowImageModal(false);
  };

  const canSend = (message.trim().length > 0 || attachments.length > 0);

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
    if (type === "soil") return <Droplets size={11} className="flex-shrink-0" />;
    return <Image size={11} className="flex-shrink-0" />;
  };

  const handleSend = () => {
    if (!canSend) return;
    
    onSendMessage(message, attachments);
    
    if (isNavigating) {
      setMessage("");
      setAttachments([]);
    }
  };

  return (
    <div style={{ position: 'relative', zIndex: 50 }}>
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
          
          {showMicButton && (
            <button
              onClick={handleStartListening}
              className={`p-1.5 transition-all duration-200 transform hover:scale-110 ${isListening
                ? 'text-red-600 hover:text-red-700 animate-pulse'
                : 'text-green-600 hover:text-green-700'}`}
              aria-label="Voice input"
              title={isListening ? (language === 'urdu' ? 'سننا بند کریں' : 'Stop listening') : (language === 'urdu' ? 'سنیں' : 'Listen')}
            >
              <Mic size={18} />
            </button>
          )}

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
              if (e.key === 'Enter' && canSend) handleSend();
            }}
          />

          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`p-1.5 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95 relative z-10 ${canSend
              ? 'bg-green-600 text-white hover:bg-green-700 shadow-md'
              : 'bg-green-600 text-white opacity-50 cursor-not-allowed'}`}
            aria-label="Send message"
          >
            <ArrowRight size={18} />
          </button>
          <ImageClassificationModal
            isOpen={showImageModal}
            onClose={handleCloseImageModal}
            selectedImage={selectedImage}
            imagePreviewUrl={imagePreviewUrl}
            classificationResult={classificationResult}
            isClassifying={isClassifying}
            imageError={imageError}
            onImageFileChange={handleImageFileChange}
            onClearImage={handleClearImage}
            onAddToChat={handleAddClassificationToChat}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatInputBar;
