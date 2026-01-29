import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import axios from "axios";
import TextInput from "../../components/common/form-fields/TextInput";
import Helpers from "../../config/Helpers";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.phone || !formData.password) {
      Helpers.toast("error", "Phone and Password are required.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${Helpers.apiUrl}signin`, {
        phone: formData.phone,
        password: formData.password,
      });

      const user = response.data.user;
      const token = response.data.token;

      // ✅ ADMIN ONLY
      if (user.user_role !== "admin") {
        Helpers.toast("error", "Only admins can log in here.");
        setIsLoading(false);
        return;
      }

      Helpers.setItem("token", token);
      Helpers.setItem("user", JSON.stringify(user));

      window.dispatchEvent(new Event("tokenChanged"));

      Helpers.toast("success", "Admin login successful.");
      navigate("/admin/dashboard");
      Helpers.scrollToTop();

    } catch (error) {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        (error.request
          ? "No response from server. Check your internet."
          : "Invalid credentials.");
      Helpers.toast("error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-12">
      {/* Left Side */}
      <div
        className="col-span-6 flex flex-col p-24"
        style={{
          background: "linear-gradient(to bottom right, #111827, #1f2933)",
        }}
      >
        <div className="flex gap-4 items-center">
          <img src="/logo.jpg" alt="SmartKisan Logo" className="w-20" />
          <h1 className="text-2xl font-medium uppercase text-white">
            Smart Kisan Admin
          </h1>
        </div>
        <h2 className="text-3xl text-gray-200 mt-4">
          Administration Panel
        </h2>
      </div>

      {/* Right Side */}
      <div className="col-span-6 bg-white flex items-center justify-center">
        <div className="w-full max-w-md px-8">
          <h2 className="text-2xl font-semibold mb-8 text-gray-800 text-center">
            Admin Sign In
          </h2>

          <form onSubmit={handleLogin} className="grid gap-4">
            <TextInput
              label="Phone Number"
              name="phone"
              type="tel"
              placeholder="0300-0000000"
              value={formData.phone}
              onChange={handleChange}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter admin password"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex justify-center mt-8">
              <button
                type="submit"
                disabled={isLoading}
                className="py-3 px-12 rounded-lg text-white flex items-center gap-1 transition-all disabled:opacity-50"
                style={{
                  background:
                    "linear-gradient(to bottom right, #111827, #1f2933)",
                }}
              >
                {isLoading ? "Signing In..." : "Admin Login"}
                {!isLoading && <ArrowRight size={20} />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
