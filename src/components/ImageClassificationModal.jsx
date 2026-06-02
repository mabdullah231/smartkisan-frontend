import React, { useContext } from "react";
import { X, Image } from "lucide-react";
import axios from "axios";
import Helpers from "../config/Helpers";
import { DarkModeContext, LanguageContext } from "../screens/DashboardLayout";

const ImageClassificationModal = ({
  isOpen,
  onClose,
  onAddToChat,
  selectedImage,
  imagePreviewUrl,
  classificationResult,
  isClassifying,
  imageError,
  onImageFileChange,
  onClearImage,
}) => {
  const darkMode = useContext(DarkModeContext);
  const language = useContext(LanguageContext);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div
        className={`w-full max-w-xl rounded-3xl border shadow-2xl ${
          darkMode ? "bg-gray-900 border-gray-700 text-gray-200" : "bg-white border-gray-200 text-gray-900"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between border-b px-5 py-4 ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
          <div>
            <h2 className="text-lg font-semibold">{language === "urdu" ? "تصویر کا تجزیہ" : "Analyse Image"}</h2>
            <p className="text-sm text-gray-400">
              {language === "urdu"
                ? "براہ کرم تصویر منتخب کریں اور ماڈل سکیننگ کا انتظار کریں۔"
                : "Select an image and wait while the model scans it."}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {!selectedImage ? (
            <label
              className={`flex flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed p-8 text-center transition-colors ${
                darkMode ? "border-gray-700 bg-gray-800 hover:border-gray-500" : "border-gray-300 bg-gray-50 hover:border-gray-400"
              }`}
            >
              <input type="file" accept="image/*" className="hidden" onChange={onImageFileChange} />
              <Image size={32} className="text-purple-500" />
              <span className="text-sm font-medium">
                {language === "urdu" ? "یہاں کلک کریں یا تصویر ڈریگ کریں" : "Click here to select an image"}
              </span>
              <span className="text-xs text-gray-500">
                {language === "urdu" ? "jpg, png, یا webp فائل منتخب کریں" : "Select a jpg, png, or webp file"}
              </span>
            </label>
          ) : (
            <div className="space-y-4">
              <div className={`rounded-3xl overflow-hidden border ${darkMode ? "border-gray-700" : "border-gray-200"} h-64 sm:h-80`}>
                <img src={imagePreviewUrl} alt="Selected" className="w-full h-full object-contain" />
              </div>

              {isClassifying ? (
                <div className="rounded-2xl border border-dashed border-green-500 bg-green-50/30 px-4 py-3 text-sm text-green-700">
                  {language === "urdu" ? "تصویر سکین کی جا رہی ہے..." : "Scanning image..."}
                </div>
              ) : classificationResult ? (
                <div className={`rounded-2xl border ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"} p-4`}>
                  <p className="font-semibold">{language === "urdu" ? "نتیجہ" : "Result"}</p>
                  <p className="text-sm">{language === "urdu" ? "کلاس" : "Class"}: {classificationResult.label}</p>
                  <p className="text-sm">{language === "urdu" ? "درستگی" : "Accuracy"}: {classificationResult.accuracy}%</p>
                </div>
              ) : imageError ? (
                <div className="rounded-2xl border border-red-400 bg-red-50 p-4 text-sm text-red-700">{imageError}</div>
              ) : (
                <div className={`rounded-2xl border ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"} p-4 text-sm text-gray-500`}>
                  {language === "urdu" ? "اب تصویر سکین ہو رہی ہے..." : "Waiting to scan selected image..."}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={onClearImage}
                  className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                    darkMode ? "border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {language === "urdu" ? "تصویر صاف کریں" : "Clear image"}
                </button>
                <button
                  onClick={onAddToChat}
                  disabled={!classificationResult}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    classificationResult ? "bg-green-600 text-white hover:bg-green-700" : "bg-green-200 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {language === "urdu" ? "چیٹ میں شامل کریں" : "Add to chat"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageClassificationModal;
