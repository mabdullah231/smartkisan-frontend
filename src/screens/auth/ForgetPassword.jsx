import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, Eye, EyeOff } from "lucide-react";
import axios from "axios";
import TextInput from "../../components/common/form-fields/TextInput";
import OTPInput from "../../components/common/form-fields/OTPInput";
import Helpers from "../../config/Helpers";

const ForgetPassword = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userId, setUserId] = useState(null);
  const [formData, setFormData] = useState({
    phone: "",
    otp: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleOTPChange = (otpValue) => {
    setFormData({
      ...formData,
      otp: otpValue,
    });
  };

  const handleSendResetCode = async () => {
    if (!formData.phone) {
      Helpers.toast("error", "Phone number is required.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${Helpers.apiUrl}password-reset-code`, {
        phone: formData.phone,
      });

      if (response.data.success) {
        Helpers.toast("success", response.data.detail || "Password reset code sent successfully.");
        setCurrentStep(2);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        (error.request
          ? "No response from server. Check your internet."
          : "Failed to send reset code.");
      Helpers.toast("error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!formData.otp || formData.otp.length !== 4) {
      Helpers.toast("error", "Please enter a valid 4-digit code.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${Helpers.apiUrl}confirm-otp`, {
        phone: formData.phone,
        code: formData.otp,
      });

      if (response.data.success) {
        setUserId(response.data.user_id);
        Helpers.toast("success", response.data.detail || "OTP verified successfully.");
        setCurrentStep(3);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        (error.request
          ? "No response from server. Check your internet."
          : "Invalid verification code.");
      Helpers.toast("error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!formData.password || !formData.confirmPassword) {
      Helpers.toast("error", "Password and confirm password are required.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Helpers.toast("error", "Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      Helpers.toast("error", "Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${Helpers.apiUrl}reset-password`, {
        phone: formData.phone,
        password: formData.password,
      });

      if (response.data.success) {
        Helpers.toast("success", response.data.detail || "Password reset successfully.");
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate("/");
        }, 1500);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        (error.request
          ? "No response from server. Check your internet."
          : "Failed to reset password.");
      Helpers.toast("error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!formData.phone) {
      Helpers.toast("error", "Phone number is required.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${Helpers.apiUrl}password-reset-code`, {
        phone: formData.phone,
      });

      if (response.data.success) {
        Helpers.toast("success", response.data.detail || "Reset code resent successfully.");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        (error.request
          ? "No response from server. Check your internet."
          : "Failed to resend code.");
      Helpers.toast("error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      handleSendResetCode();
    } else if (currentStep === 2) {
      handleVerifyOTP();
    }
  };

  const steps = [
    { number: 1, title: "Enter Phone Number" },
    { number: 2, title: "Verify Code" },
    { number: 3, title: "Reset Password" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="grid grid-cols-12 h-screen">
        {/* Left Side - Sidebar Card */}
        <div className="col-span-3 flex items-center justify-center p-4">
          <div
            className="w-full max-w-sm h-[calc(100vh-2rem)] rounded-2xl p-8 shadow-lg"
            style={{
              background: 'linear-gradient(to bottom right, rgba(43, 176, 72, 1), rgba(143, 179, 81, 1))'
            }}
          >
            {/* Logo */}
            <div className="flex gap-3 flex-col mb-12">
              <img src="/logo.jpg" alt="SmartKisan Logo" className="w-16" />
              <h1 className="text-xl font-medium uppercase text-white">Smart Kisan</h1>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-start gap-4">
                  {/* Step Circle and Line */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                        currentStep >= step.number
                          ? 'bg-white text-green-600 border-white'
                          : 'bg-transparent text-white border-white'
                      }`}
                    >
                      {currentStep > step.number ? (
                        <span className="text-sm font-bold">✓</span>
                      ) : (
                        <span className="text-sm font-bold">{step.number}</span>
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`w-0.5 h-6 mt-2 ${
                          currentStep > step.number ? 'bg-white' : 'bg-white opacity-50'
                        }`}
                      />
                    )}
                  </div>

                  {/* Step Title */}
                  <div className="flex-1 pt-2">
                    <p
                      className={`text-sm font-medium ${
                        currentStep >= step.number ? 'text-white' : 'text-white opacity-70'
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Card */}
        <div className="col-span-9 flex items-center justify-center p-4">
          <div className="w-full h-[calc(100vh-2rem)] bg-white rounded-2xl shadow-lg p-8 flex flex-col">
            {/* Step Count */}
            <div className="text-center pt-8 pb-4">
              <p className="text-lg font-medium text-green-600">
                Step {currentStep}/3
              </p>
            </div>

            {/* Form Content */}
            <div className="flex-1 max-w-md mx-auto w-full overflow-y-auto">
              <div className="space-y-6">
                {/* Step 1: Enter Phone Number */}
                {currentStep === 1 && (
                  <>
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-800">
                        Reset your password
                      </h3>
                      <p className="text-sm text-gray-600 mt-2">
                        Enter your phone number to receive a reset code
                      </p>
                    </div>

                    <TextInput
                      label="Phone Number"
                      name="phone"
                      type="tel"
                      placeholder="0300-0000000"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </>
                )}

                {/* Step 2: Verify Code */}
                {currentStep === 2 && (
                  <>
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-800">
                        Verify your phone number
                      </h3>
                      <p className="text-sm text-gray-600 mt-2">
                        Enter the code sent to {formData.phone}
                      </p>
                    </div>

                    <OTPInput
                      length={4}
                      value={formData.otp}
                      onChange={handleOTPChange}
                      label="Verification code"
                    />

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={isLoading}
                        className="text-sm text-green-600 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Resend code
                      </button>
                    </div>
                  </>
                )}

                {/* Step 3: Reset Password */}
                {currentStep === 3 && (
                  <>
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-800">
                        Create new password
                      </h3>
                      <p className="text-sm text-gray-600 mt-2">
                        Enter your new password
                      </p>
                    </div>

                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          placeholder="Enter new password"
                          value={formData.password}
                          onChange={handleChange}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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

                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          placeholder="Confirm new password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 z-10"
                        >
                          {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Buttons */}
            <div className="flex items-center justify-between pt-6 mt-auto border-t border-gray-200">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="px-6 py-2 text-green-600 hover:text-green-700 transition-colors flex items-center gap-2"
                >
                  <ArrowLeft size={20} />
                  Previous
                </button>
              ) : (
                <div></div>
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isLoading}
                  className="py-3 px-12 rounded-lg text-white flex items-center justify-center gap-1 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(to bottom right, rgba(43, 176, 72, 1), rgba(143, 179, 81, 1))'
                  }}
                >
                  {isLoading ? "Processing..." : "Next Step"}
                  {!isLoading && <ArrowRight size={20} />}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={isLoading}
                  className="py-3 px-12 rounded-lg text-white flex items-center justify-center gap-1 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(to bottom right, rgba(43, 176, 72, 1), rgba(143, 179, 81, 1))'
                  }}
                >
                  {isLoading ? "Resetting..." : "Reset Password"}
                  {!isLoading && <ArrowRight size={20} />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgetPassword;
