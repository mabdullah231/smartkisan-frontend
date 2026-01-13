import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, ArrowLeft } from "lucide-react";
import axios from "axios";
import TextInput from "../../components/common/form-fields/TextInput";
import OTPInput from "../../components/common/form-fields/OTPInput";
import Dropdown from "../../components/common/form-fields/Dropdown";
import Helpers from "../../config/Helpers";
import { ROLE_PREFIXES } from "../routes";

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [formData, setFormData] = useState({
    phone: "",
    fullName: "",
    password: "",
    confirmPassword: "",
    otp: "",
    landSize: "",
    cropType: "Wheat",
  });

  const [isComplete, setIsComplete] = useState(false);

  // Check URL params for phone and step (for unverified users from login)
  useEffect(() => {
    const phoneParam = searchParams.get("phone");
    const stepParam = searchParams.get("step");
    const userIdParam = searchParams.get("user_id");
    
    if (phoneParam) {
      setFormData(prev => ({ ...prev, phone: phoneParam }));
      
      // If user_id is provided, set it
      if (userIdParam) {
        setUserId(parseInt(userIdParam));
      }
      
      // If step is 2, resend OTP and go to step 2
      if (stepParam === "2") {
        handleExistingUserVerification(phoneParam);
      }
    }
  }, [searchParams]);

  // Handle existing unverified user - get user_id and go to step 2
  const handleExistingUserVerification = async (phone) => {
    setCurrentStep(2);
  };

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

  const handleSendCode = async () => {
    // Validate step 1 fields
    if (!formData.phone || !formData.fullName || !formData.password || !formData.confirmPassword) {
      Helpers.toast("error", "All fields are required.");
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
      const response = await axios.post(`${Helpers.apiUrl}signup`, {
        name: formData.fullName,
        phone: formData.phone,
        password: formData.password,
        user_role: "user",
      });

      if (response.data.success) {
        setUserId(response.data.user_id);
        Helpers.toast("success", response.data.detail || "Verification code sent successfully.");
        setCurrentStep(2);
      }
    } catch (error) {
      // Check if user already exists (unverified account)
      if (error.response?.data?.detail === "User already exists" || 
          error.response?.data?.detail?.includes("already exists")) {
        Helpers.toast("error", "User already exists");
        setCurrentStep(1);
        setIsLoading(false);
        return;
      } else {
        const errorMessage =
          error.response?.data?.detail ||
          error.response?.data?.message ||
          (error.request
            ? "No response from server. Check your internet."
            : "Registration failed.");
        Helpers.toast("error", errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!formData.otp || formData.otp.length !== 4) {
      Helpers.toast("error", "Please enter a valid 4-digit code.");
      return;
    }

    setIsLoading(true);
    try {
      let user_id = userId;
      
      // If userId is not available, we need to get it
      // Since backend doesn't return user_id in login when unverified,
      // we need user to have completed step 1 to get user_id
      if (!user_id) {
        if (!formData.password) {
          Helpers.toast("error", "Please complete step 1 with your password first.");
          setCurrentStep(1);
          setIsLoading(false);
          return;
        }
        
        // Try to get user_id by attempting login
        // This is a workaround - ideally backend should return user_id when verify is false
        try {
          await axios.post(`${Helpers.apiUrl}signin`, {
            phone: formData.phone,
            password: formData.password,
          });
          // If login succeeds, user is verified - shouldn't happen here
        } catch (loginError) {
          // Login failed as expected for unverified user
          // Backend doesn't return user_id in error response
          // We need backend modification or another workaround
          
          // Since we can't get user_id easily, we'll need to modify backend
          // For now, show error asking user to complete step 1 properly
          if (!user_id) {
            Helpers.toast("error", "Unable to verify. Please complete step 1 first to register your account.");
            setCurrentStep(1);
            setIsLoading(false);
            return;
          }
        }
      }

      if (!user_id) {
        Helpers.toast("error", "User ID not found. Please complete step 1 first.");
        setCurrentStep(1);
        setIsLoading(false);
        return;
      }

      const response = await axios.post(`${Helpers.apiUrl}account-verification`, {
        user_id: user_id,
        code: parseInt(formData.otp),
      });

      if (response.data.success) {
        Helpers.toast("success", response.data.detail || "Account verified successfully.");
        // Store token and user data
        Helpers.setItem("token", response.data.token);
        Helpers.setItem("user", JSON.stringify(response.data.user));
        window.dispatchEvent(new Event("tokenChanged"));
        setCurrentStep(3);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        (error.request
          ? "No response from server. Check your internet."
          : "Verification failed.");
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
      const response = await axios.post(`${Helpers.apiUrl}resend-otp`, {
        phone: formData.phone,
      });

      if (response.data.success) {
        Helpers.toast("success", response.data.detail || "Code resent successfully.");
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

  const handleSubmit = async () => {
    if (!formData.landSize || !formData.cropType) {
      Helpers.toast("error", "Land size and crop type are required.");
      return;
    }

    // For now, we'll just complete the registration since account is already created and verified
    // Land details can be saved later via profile update or a separate endpoint
    setIsLoading(true);
    try {
      // Registration is already complete after OTP verification
      // You can add an API call here to save land details if backend has such endpoint
      Helpers.toast("success", "Registration completed successfully!");
      setIsComplete(true);
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        (error.request
          ? "No response from server. Check your internet."
          : "Failed to complete registration.");
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
  
  const handleStart = () => {
    const user = Helpers.getItem("user", true);
    const token = Helpers.getItem("token");
    
    if (user && token) {
      const prefix = ROLE_PREFIXES[user.user_role === "user" ? "user" : "admin"] || ROLE_PREFIXES.user;
      navigate(`${prefix}/dashboard`);
    } else {
      navigate("/");
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      handleSendCode();
    } else if (currentStep === 2) {
      handleVerifyCode();
    }
  };

  const steps = [
    { number: 1, title: "Enter Phone Number" },
    { number: 2, title: "Verify Phone Number" },
    { number: 3, title: "Enter Land Details" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {isComplete ? (
        <div className="p-4">
          <div className="w-full h-[calc(100vh-2rem)] bg-white flex flex-col items-center justify-center rounded-2xl shadow-lg p-8">
            <img src="/signup-success.png" className="w-75" alt="Success" />
            <h2 className="text-xl  mb-8 text-gray-800 text-center">You are successfully registered!</h2>
            <button
                  type="button"
                  onClick={handleStart}
                  className="py-3 px-8 rounded-xl text-white flex items-center justify-center gap-1 transition-all hover:opacity-90"
                  style={{
                    background: 'linear-gradient(to bottom right, rgba(43, 176, 72, 1), rgba(143, 179, 81, 1))'
                  }}
                >Let's Start
                <ArrowRight size={20} /></button>
          </div>
        </div>
      ) : (
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
            {/* Step Count - Positioned below top, centered */}
            <div className="text-center pt-8 pb-4">
              <p className="text-lg font-medium text-green-600">
                Step {currentStep}/3
              </p>
            </div>

            {/* Form Content */}
            <div className="flex-1 max-w-md mx-auto w-full overflow-y-auto">
              <form 
                onSubmit={(e) => { 
                  e.preventDefault(); 
                  if (currentStep < 3) {
                    handleNext();
                  } else {
                    handleSubmit();
                  }
                }} 
                className="space-y-6"
              >

                {/* Step 1: Enter Phone Number */}
                {currentStep === 1 && (
                  <>
                    {/* Heading */}
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-800">
                        Create your account
                      </h3>
                    </div>

                    {/* Phone Number Input */}
                    <TextInput
                      label="Phone Number"
                      name="phone"
                      type="tel"
                      placeholder="0300-0000000"
                      value={formData.phone}
                      onChange={handleChange}
                    />

                    {/* Full Name Input */}
                    <TextInput
                      label="Full Name"
                      name="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={handleChange}
                    />

                    {/* Password Input */}
                    <TextInput
                      label="Password"
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                    />

                    {/* Confirm Password Input */}
                    <TextInput
                      label="Confirm Password"
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                  </>
                )}

                {/* Step 2: Verify Phone Number */}
                {currentStep === 2 && (
                  <>
                    {/* Heading */}
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-800">
                        Verify your phone number
                      </h3>
                    </div>

                    {/* OTP Input */}
                    <OTPInput
                      length={4}
                      value={formData.otp}
                      onChange={handleOTPChange}
                      label="SMS code"
                    />

                    {/* Resend Code Text */}
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

                {/* Step 3: Enter Land Details */}
                {currentStep === 3 && (
                  <>
                    {/* Subheading */}
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-800">
                        Tell us about your zameen
                      </h3>
                    </div>

                    {/* Land Size Input */}
                    <TextInput
                      label="Land Size"
                      name="landSize"
                      type="number"
                      placeholder="Enter size in acres"
                      value={formData.landSize}
                      onChange={handleChange}
                    />

                    {/* Crop Type Dropdown */}
                    <Dropdown
                      label="Crop Type"
                      name="cropType"
                      value={formData.cropType}
                      onChange={handleChange}
                      options={[
                        { value: "Wheat", label: "Wheat" }
                      ]}
                    />
                  </>
                )}
              </form>
            </div>

            {/* Bottom Buttons - Fixed at bottom of card */}
            <div className="flex items-center justify-between pt-6 mt-auto border-t border-gray-200">
              {/* Previous Button - Only show for steps 2 and 3 */}
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

              {/* Next/Complete Button */}
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
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="py-3 px-12 rounded-lg text-white flex items-center justify-center gap-1 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(to bottom right, rgba(43, 176, 72, 1), rgba(143, 179, 81, 1))'
                  }}
                >
                  {isLoading ? "Completing..." : "Complete Registration"}
                  {!isLoading && <ArrowRight size={20} />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default Register;
