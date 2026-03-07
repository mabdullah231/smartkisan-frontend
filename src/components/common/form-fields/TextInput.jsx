import React from "react";

const TextInput = ({ label, placeholder, type = "text", value, onChange, darkMode = false, ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${darkMode ? 'text-white placeholder-gray-400 bg-gray-800 border-gray-600' : 'text-black placeholder-gray-500 bg-white border-gray-300'}`}
        {...props}
      />
    </div>
  );
};

export default TextInput;

