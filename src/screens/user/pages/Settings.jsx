import React, { useContext } from "react";
import { DarkModeContext, LanguageContext } from "../../DashboardLayout";

const Settings = () => {
  const darkMode = useContext(DarkModeContext);
  const language = useContext(LanguageContext);

  return (
    <div>
      <h1 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-black'}`}>
        {language === "urdu" ? "سیٹنگز" : "Settings"}
      </h1>
      <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
        {language === "urdu" ? "سیٹنگز کا حصہ جلد نافذ کیا جائے گا۔" : "Settings component - to be implemented"}
      </p>
    </div>
  );
};

export default Settings;

