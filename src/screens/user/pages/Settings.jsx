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
        const { full_name, phone, iot_url, farm_latitude, farm_longitude } = response.data.data;
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
        // Update localStorage as well
        const updatedUser = {
          ...authUser,
          name: full_name,
          phone: phone,
          iot_url,
          farm_latitude: farm_latitude ?? null,
          farm_longitude: farm_longitude ?? null,
        };
        localStorage.setItem("authUser", JSON.stringify(updatedUser));
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
            localStorage.setItem("authUser", JSON.stringify(updatedUser));
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
        localStorage.setItem("authUser", JSON.stringify(updatedUser));
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