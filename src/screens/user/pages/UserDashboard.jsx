import React, { useContext, useEffect, useState } from "react";
import { Cloud, Leaf, Wind, Info, Plus, Mic, ArrowRight } from "lucide-react";
import Helpers from "../../../config/Helpers";
import { DarkModeContext, LanguageContext } from "../../DashboardLayout";
import axios from "axios";
const UserDashboard = () => {
  const authUser = Helpers.getAuthUser();
  const darkMode = useContext(DarkModeContext);
  const language = useContext(LanguageContext);
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState(null);
  const [weatherData, setWeatherData] = useState(null);

  useEffect(() => {
    // Try to get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
          console.log(position);
        },
        (error) => {
          console.error("Geolocation error:", error);
          // Use default location (Multan)
          setLocation({ lat: 30.19, lon: 71.47 });
        }
      );
    } else {
      // Browser doesn't support geolocation
      setLocation({ lat: 30.19, lon: 71.47 });
    }
  }, []);

  const fetchWeather = async () => {
    if (!location) return;
    
    try {
      const response = await 
      axios.post(`${Helpers.apiUrl}weather/get-weather`, {
        latitude: location.lat,
        longitude: location.lon
      }, Helpers.getAuthHeaders());
      
      if (response.data.success) {
        setWeatherData(response.data);
        console.log(response.data);
      }
    } catch (error) {
      console.error("Error fetching weather:", error);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [location]);

  const cards = [
    {
      title: language === "urdu" ? "موسم" : "Weather",
      icon: Cloud,
      value: weatherData?.temperature ? `${language === "urdu" ? `°C ${weatherData.condition_text_urdu} ${weatherData.temperature}` : `${weatherData.condition_text} ${weatherData.temperature}°C`}` : language === "urdu" ? "لوڈ ہو رہا ہے" : "Loading"
    },
    {
      title: language === "urdu" ? "ہوا میں نمی" : "Air Humidity",
      icon: Wind,
      value: weatherData?.humidity 
        ? language === "urdu" 
          ? `${weatherData.humidity}% ${weatherData.humidity > 70 ? "زیادہ" : weatherData.humidity < 50 ? "کم" : "درمیانہ"}`
          : `${weatherData.humidity}% ${weatherData.humidity > 70 ? "High" : weatherData.humidity < 50 ? "Low" : "Moderate"}`
        : language === "urdu" ? "لوڈ ہو رہا ہے" : "Loading"
    },
    {
      title: language === "urdu" ? "مٹی کی نمی" : "Soil Moisture",
      icon: Leaf,
      value: language === "urdu" ? "65٪ بہترین" : "65% Good"
    },
    {
      title: language === "urdu" ? "پودوں کی صحت" : "Plant Health",
      icon: Leaf,
      value: language === "urdu" ? "بہترین" : "Good"
    },
    {
      title: language === "urdu" ? "تجویز" : "Recommendation",
      icon: Info,
      value: language === "urdu" ? "ابھی پانی دیں" : "Water Now"
    }
  ];

  return (
    <div className="relative min-h-[calc(100vh-200px)] pb-24">
      <p className={`transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {language === "urdu" ? "واپس آنے پر خوش آمدید،" : "Welcome back,"} {authUser?.name ?? (language === "urdu" ? "صارف" : "User")}
      </p>
      <h1 className={`text-4xl font-bold mt-2 mb-5 transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {language === "urdu" ? "ڈیش بورڈ" : "Dashboard"}
      </h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mr-4">
        {cards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <div
              key={index}
              className={`rounded-lg sm:rounded-xl md:rounded-2xl px-2 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3 flex flex-col shadow-sm hover:shadow-md transition-all duration-200 h-16 sm:h-20 md:h-24 ${darkMode ? 'bg-gray-800' : 'bg-white'
                }`}
            >
              <IconComponent size={14} className="sm:size-4 md:size-5 text-green-600 mb-0.5 sm:mb-1 md:mb-1.5" />
              <p className={`text-[8px] sm:text-[9px] md:text-[12px] font-bold mb-auto leading-tight transition-colors duration-300 ${darkMode ? 'text-gray-200' : 'text-black'
                }`}>{card.title}</p>
              <p className={`text-[10px] sm:text-xs md:text-sm font-semibold mt-auto transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-400'
                }`}>{card.value}</p>
            </div>
          );
        })}
      </div>
      <div className={`rounded-lg sm:rounded-xl md:rounded-2xl px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-5 flex gap-3 sm:gap-4 md:gap-6 shadow-sm hover:shadow-md transition-all duration-200 mr-4 my-4 ${darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
        <div className="border-r border-green-500 h-auto min-h-[60px] sm:min-h-[80px] md:min-h-[96px] border-2 flex-shrink-0"></div>
        <div className="flex flex-col justify-center min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-green-500 font-semibold mb-1 sm:mb-2">{language === "urdu" ? "روزانہ تجویز" : "Daily Advice"}</h2>
          <p className={`text-sm sm:text-base md:text-lg lg:text-xl leading-tight sm:leading-snug md:leading-normal break-words transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-400'
            }`}>{language === "urdu" ? "آج فصلیں گھمائیں اور آج پانی نہ دیں۔" : "Rotate Crops Today & Don't give water today."}</p>
        </div>
      </div>

      {/* Chatbot Interface - Fixed at bottom, centered within dashboard content */}
      <div className="fixed bottom-4 z-50 lg:left-[225px] lg:right-0 left-0 right-0 px-2 sm:px-4">
        <div className="max-w-4xl mx-auto">
          <div className={`w-full rounded-4xl px-4 py-3 flex items-center gap-3 shadow-lg transition-all duration-300 ${darkMode
            ? 'bg-gray-800 border border-gray-700'
            : 'bg-gradient-to-r from-gray-150 to-gray-150 border border-gray-300'
            }`}>
            {/* Left Side - Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                className="p-2 transition-colors duration-200 text-green-600 hover:text-green-700"
                aria-label="Add attachment"
              >
                <Plus size={20} />
              </button>
              <button
                className="p-2 transition-colors duration-200 text-green-600 hover:text-green-700"
                aria-label="Voice input"
              >
                <Mic size={20} />
              </button>
            </div>

            {/* Text Input Area */}
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask me anything..."
              className={`flex-1 px-4 py-2 rounded-2xl border-0 outline-none text-sm transition-colors duration-300 ${darkMode
                ? 'bg-gray-700 text-gray-200 placeholder-gray-400'
                : 'bg-transparent text-gray-800 placeholder-gray-500'
                }`}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && message.trim()) {
                  // Handle send message
                  console.log('Sending:', message);
                  setMessage("");
                }
              }}
            />

            {/* Right Side - Send Button */}
            <button
              onClick={() => {
                if (message.trim()) {
                  // Handle send message
                  console.log('Sending:', message);
                  setMessage("");
                }
              }}
              className={`p-2 rounded-lg transition-all duration-200 ${message.trim()
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
                : 'bg-green-600 text-white opacity-50 cursor-not-allowed'
                }`}
              disabled={!message.trim()}
              aria-label="Send message"
            >
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;

