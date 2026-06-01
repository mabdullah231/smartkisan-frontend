import React, { useContext, useState, useEffect } from "react";
import { User, Cpu, Save, Key, MapPin } from "lucide-react";
import { DarkModeContext, LanguageContext } from "../../DashboardLayout";
import TextInput from "../../../components/common/form-fields/TextInput";
import Helpers from "../../../config/Helpers";
import axios from "axios";

const UserSettings = () => {
  const darkMode = useContext(DarkModeContext);
  const language = useContext(LanguageContext);

  const authUser = Helpers.getAuthUser();

  // Tab state: 'details' or 'iot'
  const [activeTab, setActiveTab] = useState("details");

  // Farm details state
  const [farmSize, setFarmSize] = useState("");
  const [cropType, setCropType] = useState("Wheat");
  const [cropStage, setCropStage] = useState("Germination");
  const [savingFarmDetails, setSavingFarmDetails] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // IoT URL state
  const [iotUrl, setIotUrl] = useState("");
  const [farmLatitude, setFarmLatitude] = useState(null);
  const [farmLongitude, setFarmLongitude] = useState(null);

  // Loading states
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [savingIot, setSavingIot] = useState(false);
  const [capturingFarmLocation, setCapturingFarmLocation] = useState(false);

  // // Initialize forms with authUser data
  // useEffect(() => {
  //   if (authUser) {
  //     setProfileForm({
  //       name: authUser.name || "",
  //       phone: authUser.phone || "",
  //     });
  //     setIotUrl(authUser.iot_url || "");
  //   }
  // }, [authUser]);

  // Fetch user profile from backend
  const fetchProfile = async () => {
    try {
      const response = await axios.get(
        `${Helpers.apiUrl}settings/user/profile`,
        Helpers.getAuthHeaders()
      );
      if (response.data.success) {
        const { full_name, phone, iot_url, farm_latitude, farm_longitude, farm_size, crop_type, crop_growth_stage } = response.data.data;
        setProfileForm({
          name: full_name || "",
          phone: phone || "",
        });
        setIotUrl(iot_url || "");
        setFarmLatitude(
          farm_latitude != null && farm_latitude !== "" ? Number(farm_latitude) : null
        );
        setFarmLongitude(
          farm_longitude != null && farm_longitude !== "" ? Number(farm_longitude) : null
        );
        setFarmSize(farm_size ?? "");
        setCropType(crop_type ?? "Wheat");
        setCropStage(crop_growth_stage ?? "Germination");
        // Update localStorage `user` object as well
        const updatedUser = {
          ...authUser,
          name: full_name,
          phone: phone,
          iot_url,
          farm_latitude: farm_latitude ?? null,
          farm_longitude: farm_longitude ?? null,
          farm_size: farm_size ?? null,
          crop_type: crop_type ?? null,
          crop_growth_stage: crop_growth_stage ?? null,
        };
        Helpers.setItem("user", updatedUser, true);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      // Fallback to localStorage
    }
  };

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  // Handlers for profile inputs
  const handleProfileChange = (field, value) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  // Handlers for password inputs
  const handlePasswordChange = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
  };

  // Save profile (name & phone)
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const response = await axios.post(
        `${Helpers.apiUrl}settings/user/settings`,
        {
          type: "profile",
          full_name: profileForm.name,
          phone: profileForm.phone,
        },
        Helpers.getAuthHeaders()
      );

      if (response.data.success) {
        // Update stored user data
        const updatedUser = { ...authUser, name: profileForm.name, phone: profileForm.phone };
        localStorage.setItem("authUser", JSON.stringify(updatedUser));
        Helpers.toast("success", language === "urdu" ? "پروفائل اپ ڈیٹ ہو گئی" : "Profile updated successfully");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Helpers.toast("error", error.response?.data?.detail || (language === "urdu" ? "پروفائل اپ ڈیٹ کرنے میں ناکامی" : "Failed to update profile"));
    } finally {
      setSavingProfile(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    // Basic validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      Helpers.toast("error", language === "urdu" ? "براہ کرم تمام فیلڈز بھریں" : "Please fill all fields");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      Helpers.toast("error", language === "urdu" ? "نیا پاس ورڈ کم از کم 6 حروف کا ہو" : "New password must be at least 6 characters");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Helpers.toast("error", language === "urdu" ? "نیا پاس ورڈ اور تصدیق مماثل نہیں" : "New password and confirmation do not match");
      return;
    }

    setChangingPassword(true);
    try {
      const response = await axios.post(
        `${Helpers.apiUrl}settings/user/settings`,
        {
          type: "password",
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword,
          confirm_password: passwordForm.confirmPassword,
        },
        Helpers.getAuthHeaders()
      );

      if (response.data.success) {
        Helpers.toast("success", language === "urdu" ? "پاس ورڈ تبدیل ہو گیا" : "Password changed successfully");
        // Clear password fields
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (error) {
      console.error("Error changing password:", error);
      Helpers.toast("error", error.response?.data?.detail || (language === "urdu" ? "پاس ورڈ تبدیل کرنے میں ناکامی" : "Failed to change password"));
    } finally {
      setChangingPassword(false);
    }
  };

  const farmLocationDisplay =
    farmLatitude != null && farmLongitude != null
      ? `${farmLatitude.toFixed(5)}, ${farmLongitude.toFixed(5)}`
      : "";

  const handleCaptureFarmLocation = () => {
    if (!navigator.geolocation) {
      Helpers.toast(
        "error",
        language === "urdu"
          ? "براؤزر مقام کی سپورٹ نہیں کرتا"
          : "Geolocation is not supported by this browser"
      );
      return;
    }
    setCapturingFarmLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        try {
          const response = await axios.post(
            `${Helpers.apiUrl}settings/user/settings`,
            {
              type: "farm_location",
              latitude: lat,
              longitude: lon,
            },
            Helpers.getAuthHeaders()
          );
          if (response.data.success) {
            setFarmLatitude(lat);
            setFarmLongitude(lon);
            const updatedUser = {
              ...Helpers.getAuthUser(),
              farm_latitude: lat,
              farm_longitude: lon,
            };
            Helpers.setItem("user", updatedUser, true);
            Helpers.toast(
              "success",
              language === "urdu"
                ? "فارم کا مقام محفوظ ہو گیا"
                : "Farm location saved successfully"
            );
          }
        } catch (error) {
          console.error("Error saving farm location:", error);
          Helpers.toast(
            "error",
            error.response?.data?.detail ||
              (language === "urdu"
                ? "مقام محفوظ کرنے میں ناکامی"
                : "Failed to save farm location")
          );
        } finally {
          setCapturingFarmLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setCapturingFarmLocation(false);
        Helpers.toast(
          "error",
          language === "urdu"
            ? "مقام تک رسائی مسترد یا دستیاب نہیں"
            : "Location access denied or unavailable"
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Save IoT URL
  const handleSaveIot = async () => {
    setSavingIot(true);
    try {
      const response = await axios.post(
        `${Helpers.apiUrl}settings/user/settings`,
        {
          type: "iot",
          iot_url: iotUrl,
        },
        Helpers.getAuthHeaders()
      );

      if (response.data.success) {
        const updatedUser = { ...authUser, iot_url: iotUrl };
        Helpers.setItem("user", updatedUser, true);
        Helpers.toast("success", language === "urdu" ? "IoT ڈیوائس یو آر ایل محفوظ ہو گیا" : "IoT device URL saved successfully");
      }
    } catch (error) {
      console.error("Error saving IoT URL:", error);
      Helpers.toast("error", error.response?.data?.detail || (language === "urdu" ? "IoT یو آر ایل محفوظ کرنے میں ناکامی" : "Failed to save IoT URL"));
    } finally {
      setSavingIot(false);
    }
  };

  // Tab button helper
  const tabButtonClass = (tab) => {
    const isActive = activeTab === tab;
    return `
      flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
      ${isActive
        ? darkMode
          ? "bg-green-600 text-white shadow-md"
          : "bg-green-600 text-white shadow-md"
        : darkMode
        ? "text-gray-300 hover:bg-gray-700"
        : "text-gray-600 hover:bg-gray-100"
      }
    `;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Title */}
      <h1 className={`text-2xl md:text-3xl font-bold mb-6 transition-colors duration-300 ${
        darkMode ? "text-gray-100" : "text-gray-900"
      }`}>
        {language === "urdu" ? "سیٹنگز" : "Settings"}
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("details")}
          className={tabButtonClass("details")}
        >
          <User size={18} />
          <span>{language === "urdu" ? "ذاتی معلومات" : "User Details"}</span>
        </button>
        <button
          onClick={() => setActiveTab("farm")}
          className={tabButtonClass("farm")}
        >
          <MapPin size={18} />
          <span>{language === "urdu" ? "فارم کی تفصیلات" : "Farm Details"}</span>
        </button>
        <button
          onClick={() => setActiveTab("iot")}
          className={tabButtonClass("iot")}
        >
          <Cpu size={18} />
          <span>{language === "urdu" ? "IoT ڈیوائس" : "IoT Device"}</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className={`rounded-xl shadow-sm overflow-hidden transition-colors duration-300 ${
        darkMode ? "bg-gray-800" : "bg-white"
      }`}>
        {/* User Details Tab */}
        {activeTab === "details" && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Information Card */}
              <div className={`rounded-lg p-5 ${
                darkMode ? "bg-gray-700/50" : "bg-gray-50"
              }`}>
              <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                darkMode ? "text-gray-200" : "text-gray-800"
              }`}>
                <User size={20} />
                {language === "urdu" ? "پروفائل کی معلومات" : "Profile Information"}
              </h2>

              <div className="space-y-4">
                {/* Name */}
                <TextInput
                  label={language === "urdu" ? "نام" : "Name"}
                  placeholder={language === "urdu" ? "اپنا نام درج کریں" : "Enter your name"}
                  value={profileForm.name}
                  onChange={(e) => handleProfileChange("name", e.target.value)}
                  darkMode={darkMode}
                  required
                />

                {/* Phone */}
                <TextInput
                  label={language === "urdu" ? "فون نمبر" : "Phone Number"}
                  placeholder={language === "urdu" ? "اپنا فون نمبر درج کریں" : "Enter your phone number"}
                  value={profileForm.phone}
                  onChange={(e) => handleProfileChange("phone", e.target.value)}
                  darkMode={darkMode}
                />

                {/* Update Profile Button */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      savingProfile
                        ? "bg-green-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    } text-white shadow-sm`}
                  >
                    <Save size={18} />
                    {savingProfile
                      ? (language === "urdu" ? "محفوظ ہو رہا ہے..." : "Saving...")
                      : (language === "urdu" ? "پروفائل محفوظ کریں" : "Update Profile")}
                  </button>
                </div>
              </div>
            </div>

            {/* Change Password Card */}
            <div className={`rounded-lg p-5 ${
              darkMode ? "bg-gray-700/50" : "bg-gray-50"
            }`}>
              <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                darkMode ? "text-gray-200" : "text-gray-800"
              }`}>
                <Key size={20} />
                {language === "urdu" ? "پاس ورڈ تبدیل کریں" : "Change Password"}
              </h2>

              <div className="space-y-4">
                {/* Current Password */}
                <TextInput
                  label={language === "urdu" ? "موجودہ پاس ورڈ" : "Current Password"}
                  placeholder="••••••••"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                  darkMode={darkMode}
                  required
                />

                {/* New Password */}
                <TextInput
                  label={language === "urdu" ? "نیا پاس ورڈ" : "New Password"}
                  placeholder="••••••••"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                  darkMode={darkMode}
                  required
                />

                {/* Confirm New Password */}
                <TextInput
                  label={language === "urdu" ? "نیا پاس ورڈ کی تصدیق" : "Confirm New Password"}
                  placeholder="••••••••"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                  darkMode={darkMode}
                  required
                />

                {/* Change Password Button */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleChangePassword}
                    disabled={changingPassword}
                    className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      changingPassword
                        ? "bg-green-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    } text-white shadow-sm`}
                  >
                    <Key size={18} />
                    {changingPassword
                      ? (language === "urdu" ? "محفوظ ہو رہا ہے..." : "Changing...")
                      : (language === "urdu" ? "پاس ورڈ تبدیل کریں" : "Change Password")}
                  </button>
                </div>
              </div>
            </div>
            </div>
          </div>
        )}
        {/* Farm Details Tab */}
        {activeTab === "farm" && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column: Land size & Crop Type */}
              <div className={`rounded-lg p-5 ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
                <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                  <MapPin size={20} />
                  {language === "urdu" ? "فارم کی تفصیلات" : "Farm Details"}
                </h2>

                <div className="space-y-4">
                  <TextInput
                    label={language === "urdu" ? "زمین کا سائز (ایکڑ)" : "Land Size (acres)"}
                    placeholder={language === "urdu" ? "مثال: 2.5" : "e.g. 2.5"}
                    value={farmSize}
                    onChange={(e) => setFarmSize(e.target.value)}
                    darkMode={darkMode}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{language === "urdu" ? "فصل کی قسم" : "Crop Type"}</label>
                    <select
                      value={cropType}
                      onChange={(e) => setCropType(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="Wheat">{language === "urdu" ? "گندم" : "Wheat"}</option>
                      <option value="Rice">{language === "urdu" ? "چاول" : "Rice"}</option>
                      <option value="Maize">{language === "urdu" ? "مکئی" : "Maize"}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right column: Crop stage & Farm location */}
              <div className={`rounded-lg p-5 ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{language === "urdu" ? "پودے کا مرحلہ" : "Crop Growth Stage"}</label>
                    <select
                      value={cropStage}
                      onChange={(e) => setCropStage(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="Germination">Germination — جرمنیٹیشن</option>
                      <option value="Tillering">Tillering — ٹِلرنگ</option>
                      <option value="Jointing">Jointing — جوائنٹنگ</option>
                      <option value="Booting">Booting — بوٹنگ</option>
                      <option value="Heading/Flowering">Heading/Flowering — ہیڈنگ/فلَوَرِنگ</option>
                      <option value="Grain Filling">Grain Filling — گرین فلِنگ</option>
                      <option value="Harvest">Harvest — فصل کٹائی</option>
                    </select>
                  </div>

                  <div className="rounded-lg p-0 bg-transparent">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{language === "urdu" ? "فارم کا مقام" : "Farm location"}</label>
                    <TextInput
                      label={language === "urdu" ? "عرض بلد، طول بلد" : "Latitude, longitude"}
                      placeholder={language === "urdu" ? "ابھی تک کوئی مقام محفوظ نہیں" : "No location saved yet"}
                      value={farmLocationDisplay}
                      onChange={() => {}}
                      darkMode={darkMode}
                      readOnly
                    />
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={handleCaptureFarmLocation}
                        disabled={capturingFarmLocation}
                        className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${capturingFarmLocation ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"} text-white shadow-sm`}
                      >
                        <MapPin size={18} />
                        {capturingFarmLocation
                          ? language === "urdu"
                            ? "مقام لیا جا رہا ہے..."
                            : "Getting location..."
                          : language === "urdu"
                          ? "فارم کا مقام شامل کریں"
                          : "Add farm location"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save button below the two columns */}
            <div className="flex justify-end mt-4">
              <button
                onClick={async () => {
                  setSavingFarmDetails(true);
                  try {
                    const payload = {
                      type: "farm_details",
                      farm_size: farmSize ? parseFloat(farmSize) : null,
                      crop_type: cropType,
                      crop_growth_stage: cropStage,
                    };
                    const res = await axios.post(`${Helpers.apiUrl}settings/user/settings`, payload, Helpers.getAuthHeaders());
                    if (res.data.success) {
                      Helpers.toast("success", language === "urdu" ? "فارم کی تفصیلات محفوظ ہو گئیں" : "Farm details saved successfully");
                      try {
                        const current = Helpers.getAuthUser() || {};
                        const updatedUser = {
                          ...current,
                          farm_size: (res.data.farm_size !== undefined) ? res.data.farm_size : (payload.farm_size ?? current.farm_size),
                          crop_type: (res.data.crop_type !== undefined) ? res.data.crop_type : (payload.crop_type ?? current.crop_type),
                          crop_growth_stage: (res.data.crop_growth_stage !== undefined) ? res.data.crop_growth_stage : (payload.crop_growth_stage ?? current.crop_growth_stage),
                        };
                        localStorage.setItem("authUser", JSON.stringify(updatedUser));
                      } catch (e) {
                        // ignore localStorage errors
                      }
                    }
                  } catch (e) {
                    console.error("Error saving farm details:", e);
                    Helpers.toast("error", e.response?.data?.detail || (language === "urdu" ? "محفوظ کرنے میں ناکامی" : "Failed to save farm details"));
                  } finally {
                    setSavingFarmDetails(false);
                  }
                }}
                disabled={savingFarmDetails}
                className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${savingFarmDetails ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"} text-white shadow-sm`}
              >
                <Save size={18} />
                {savingFarmDetails ? (language === "urdu" ? "محفوظ ہو رہا ہے..." : "Saving...") : (language === "urdu" ? "تفصیلات محفوظ کریں" : "Save Details")}
              </button>
            </div>
          </div>
        )}

        {/* IoT Device Tab (unchanged) */}
        {activeTab === "iot" && (
          <div className="p-6">
            <div className="space-y-6">
              <TextInput
                label={language === "urdu" ? "IoT ڈیوائس یو آر ایل" : "IoT Device URL"}
                placeholder="https://example.com/data"
                value={iotUrl}
                onChange={(e) => setIotUrl(e.target.value)}
                darkMode={darkMode}
              />
              <p className={`text-xs ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}>
                {language === "urdu"
                  ? "یہ یو آر ایل استعمال ہو گا IoT ڈیوائس سے ڈیٹا لینے کے لیے"
                  : "This URL will be used to fetch data from your IoT device"}
              </p>

              <div
                className={`rounded-lg p-5 ${
                  darkMode ? "bg-gray-700/50" : "bg-gray-50"
                }`}
              >
                <h2
                  className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                    darkMode ? "text-gray-200" : "text-gray-800"
                  }`}
                >
                  <MapPin size={20} />
                  {language === "urdu" ? "فارم کا مقام" : "Farm location"}
                </h2>
                <TextInput
                  label={language === "urdu" ? "عرض بلد، طول بلد" : "Latitude, longitude"}
                  placeholder={
                    language === "urdu"
                      ? "ابھی تک کوئی مقام محفوظ نہیں"
                      : "No location saved yet"
                  }
                  value={farmLocationDisplay}
                  onChange={() => {}}
                  darkMode={darkMode}
                  readOnly
                />
                <p
                  className={`text-xs mt-2 mb-4 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {language === "urdu"
                    ? "ڈیش بورڈ پر موسم کے لیے یہی مقام استعمال ہو گا۔ نئے مقام کے لیے دوبارہ بٹن دبائیں۔"
                    : "Weather on the dashboard uses these coordinates. Use the button again to update."}
                </p>
                <button
                  type="button"
                  onClick={handleCaptureFarmLocation}
                  disabled={capturingFarmLocation}
                  className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    capturingFarmLocation
                      ? "bg-green-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  } text-white shadow-sm`}
                >
                  <MapPin size={18} />
                  {capturingFarmLocation
                    ? language === "urdu"
                      ? "مقام لیا جا رہا ہے..."
                      : "Getting location..."
                    : language === "urdu"
                    ? "فارم کا مقام شامل کریں"
                    : "Add farm location"}
                </button>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSaveIot}
                  disabled={savingIot}
                  className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    savingIot
                      ? "bg-green-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  } text-white shadow-sm`}
                >
                  <Save size={18} />
                  {savingIot
                    ? (language === "urdu" ? "محفوظ ہو رہا ہے..." : "Saving...")
                    : (language === "urdu" ? "یو آر ایل محفوظ کریں" : "Save URL")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSettings;