import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import axios from "axios";
import TextInput from "../../components/common/form-fields/TextInput";
import Helpers from "../../config/Helpers";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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

      // Check if verification is required
      if (response.data.verify === false) {
        Helpers.toast("error", response.data.detail || "Phone number not verified. Redirecting to verification...");
        // Redirect to register page with phone pre-filled, step 2, and user_id
        const userId = response.data.user_id;
        navigate(`/register?phone=${encodeURIComponent(formData.phone)}&step=2&user_id=${userId || ''}`);
        setIsLoading(false);
        return;
      }

      const userRole = response.data.user.user_role;
      // Assuming user_role is user
      if (userRole !== "user") {
        Helpers.toast("error", "Admin cannot log in from this page.");
        setIsLoading(false);
        return;
      } 

      Helpers.setItem("token", response.data.token);
      Helpers.setItem("user", JSON.stringify(response.data.user));

      // Dispatch event to trigger WebSocket reconnection
      window.dispatchEvent(new Event("tokenChanged"));

      Helpers.toast("success", "Login successful.");
      navigate("/user/dashboard");
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
      {/* Left Side - Gradient */}
      <div 
        className="col-span-6 flex flex-col p-24"
        style={{
          background: 'linear-gradient(to bottom right, rgba(43, 176, 72, 1), rgba(143, 179, 81, 1))'
        }}
      >
        <div className="flex gap-4 items-center">
          <img src="/logo.jpg" alt="SmartKisan Logo" className="w-20" />
          <h1 className="text-2xl font-medium uppercase text-white">Smart Kisan</h1>
        </div>
        <h2 className="text-3xl text-white mt-4">Empowering Every Farmer</h2>
      </div>

      {/* Right Side - White with Login Form */}
      <div className="col-span-6 bg-white flex items-center justify-center">
        <div className="w-full max-w-md px-8">
          <h2 className="text-2xl font-semibold mb-8 text-gray-800 text-center">Sign In to Smart Kisan</h2>
          
          <form onSubmit={handleLogin} className="grid gap-4">
            {/* Phone Number Input */}
            <TextInput
              label="Phone Number"
              name="phone"
              type="tel"
              placeholder="0300-0000000"
              value={formData.phone}
              onChange={handleChange}
            />

            {/* Password Input */}
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent [&::-ms-reveal]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
                  style={{
                    WebkitTextSecurity: showPassword ? 'none' : 'disc',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 z-10"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">Remember me</span>
              </label>
              <a href="/forget-password" className="text-sm text-green-600 hover:text-green-700" onClick={(e) => { e.preventDefault(); navigate("/forget-password"); }}>
                Forgot password?
              </a>
            </div>

            {/* Sign In Button */}
            <div className="flex justify-center mt-8">
              <button
                type="submit"
                disabled={isLoading}
                className="py-3 px-12 rounded-lg text-white flex items-center justify-center gap-1 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(to bottom right, rgba(43, 176, 72, 1), rgba(143, 179, 81, 1))'
                }}
              >
                {isLoading ? "Signing In..." : "Sign In"}
                {!isLoading && <ArrowRight size={20} />}
              </button>
            </div>

            {/* Don't have an account */}
            <p className="text-center text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <a href="/register" className="text-green-600 hover:text-green-700 font-medium">
                Sign up
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
