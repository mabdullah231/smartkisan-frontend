import React, { useContext, useState, useEffect } from "react";
import { Plus, Eye, Pencil, Trash2, X, ChevronLeft, Check } from "lucide-react";
import { DarkModeContext } from "../../DashboardLayout";
import TextInput from "../../../components/common/form-fields/TextInput";
import Helpers from "../../../config/Helpers";
import axios from "axios";

const AdminSettings = () => {
  const darkMode = useContext(DarkModeContext);
  const [currentView, setCurrentView] = useState("list"); // 'list', 'add', 'edit', 'view'
  const [selected, setSelected] = useState(null);
  const [apis, setApis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState({
    category: "",
    provider: "",
    base_url: "",
    api_key: "",
    is_active: true,
    extra_config: [],
  });

  // Fetch all APIs on component mount
  useEffect(() => {
    fetchApis();
  }, []);

  const fetchApis = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${Helpers.apiUrl}apis`,
        Helpers.getAuthHeaders()
      );
      if (response.data.success) {
        setApis(response.data.apis);
      }
    } catch (error) {
      console.error("Error fetching APIs:", error);
      Helpers.toast("error", "Failed to load API configurations");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      category: "",
      provider: "",
      base_url: "",
      api_key: "",
      is_active: true,
      extra_config: [],
    });
    setSelected(null);
  };

  const openAdd = () => {
    resetForm();
    setCurrentView("add");
  };

  const openEdit = (item) => {
    const extraConfigArray = item.extra_config
      ? Object.entries(item.extra_config).map(([key, value]) => ({ key, value }))
      : [];
    setFormData({
      category: item.category || "",
      provider: item.provider || "",
      base_url: item.base_url || "",
      api_key: item.api_key || "",
      is_active: item.is_active,
      extra_config: extraConfigArray,
    });
    setSelected(item);
    setCurrentView("edit");
  };

  const openView = async (item) => {
    try {
      const response = await axios.get(
        `${Helpers.apiUrl}apis/${item.id}`,
        Helpers.getAuthHeaders()
      );
      if (response.data.success) {
        const apiData = response.data.api;
        const extraConfigArray = apiData.extra_config
          ? Object.entries(apiData.extra_config).map(([key, value]) => ({ key, value }))
          : [];
        setFormData({
          category: apiData.category || "",
          provider: apiData.provider || "",
          base_url: apiData.base_url || "",
          api_key: apiData.api_key || "",
          is_active: apiData.is_active,
          extra_config: extraConfigArray,
        });
        setSelected(apiData);
        setCurrentView("view");
      }
    } catch (error) {
      console.error("Error loading API details:", error);
      Helpers.toast("error", "Failed to load API details");
    }
  };

  const backToList = () => {
    setCurrentView("list");
    resetForm();
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addConfigField = () => {
    setFormData((prev) => ({
      ...prev,
      extra_config: [...prev.extra_config, { key: "", value: "" }],
    }));
  };

  const updateConfigField = (index, field, value) => {
    setFormData((prev) => {
      const newConfig = [...prev.extra_config];
      newConfig[index][field] = value;
      return { ...prev, extra_config: newConfig };
    });
  };

  const removeConfigField = (index) => {
    setFormData((prev) => ({
      ...prev,
      extra_config: prev.extra_config.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    try {
      const configObject = formData.extra_config.reduce((acc, { key, value }) => {
        if (key.trim()) {
          acc[key.trim()] = value;
        }
        return acc;
      }, {});

      const dataToSave = {
        category: formData.category,
        provider: formData.provider,
        base_url: formData.base_url,
        api_key: formData.api_key,
        is_active: formData.is_active,
        extra_config: Object.keys(configObject).length > 0 ? configObject : null,
      };

      if (currentView === "add") {
        // POST new API
        const response = await axios.post(
          `${Helpers.apiUrl}apis`,
          dataToSave,
          Helpers.getAuthHeaders()
        );
        if (response.data.success) {
          Helpers.toast("success", "API configuration created successfully");
          await fetchApis();
          backToList();
        }
      } else if (currentView === "edit") {
        // PUT update API
        const response = await axios.put(
          `${Helpers.apiUrl}apis/${selected.id}`,
          dataToSave,
          Helpers.getAuthHeaders()
        );
        if (response.data.success) {
          Helpers.toast("success", "API configuration updated successfully");
          await fetchApis();
          backToList();
        }
      }
    } catch (error) {
      console.error("Error saving API:", error);
      Helpers.toast("error", error.response?.data?.detail || "Failed to save API configuration");
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
  };

  const confirmDelete = async (id) => {
    try {
      const response = await axios.delete(
        `${Helpers.apiUrl}apis/${id}`,
        Helpers.getAuthHeaders()
      );
      if (response.data.success) {
        Helpers.toast("success", "API configuration deleted successfully");
        await fetchApis();
        setDeletingId(null);
      }
    } catch (error) {
      console.error("Error deleting API:", error);
      Helpers.toast("error", "Failed to delete API configuration");
      setDeletingId(null);
    }
  };

  const cancelDelete = () => {
    setDeletingId(null);
  };

  // List View
  if (currentView === "list") {
    return (
      <div className={``}>
        <div className="">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h1
              className={`text-2xl md:text-3xl font-bold ${
                darkMode ? "text-gray-100" : "text-gray-900"
              }`}
            >
              API Configuration
            </h1>
            <button
              onClick={openAdd}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg shadow-sm hover:bg-green-700 transition-colors font-medium"
            >
              <Plus size={20} /> Add New API
            </button>
          </div>

          {/* Table - Desktop (900px and above) */}
          <div
            className={`hidden lg:block rounded-xl overflow-hidden shadow-sm ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            {apis.length === 0 ? (
              <div className={`p-8 text-center ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  No APIs created yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead
                  className={`${
                    darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-50 text-gray-600"
                  }`}
                >
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold text-sm">Category</th>
                    <th className="text-left px-6 py-3 font-semibold text-sm">Provider</th>
                    <th className="text-left px-6 py-3 font-semibold text-sm">Base URL</th>
                    <th className="text-left px-6 py-3 font-semibold text-sm">Status</th>
                    <th className="text-right px-6 py-3 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {apis.map((item) => (
                    <tr
                      key={item.id}
                      className={`border-t ${
                        darkMode
                          ? "border-gray-700 hover:bg-gray-750"
                          : "border-gray-200 hover:bg-gray-50"
                      } transition-colors`}
                    >
                      <td
                        className={`px-6 py-4 font-medium ${
                          darkMode ? "text-gray-200" : "text-gray-900"
                        }`}
                      >
                        {item.category}
                      </td>
                      <td
                        className={`px-6 py-4 font-medium ${
                          darkMode ? "text-gray-200" : "text-gray-900"
                        }`}
                      >
                        {item.provider}
                      </td>
                      <td
                        className={`px-6 py-4 text-sm break-all ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {item.base_url}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            item.is_active
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {item.is_active ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openView(item)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              darkMode
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : "bg-blue-500 hover:bg-blue-600 text-white"
                            }`}
                            title="View Details"
                          >
                            <Eye size={16} className="inline mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => openEdit(item)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              darkMode
                                ? "bg-amber-600 hover:bg-amber-700 text-white"
                                : "bg-amber-500 hover:bg-amber-600 text-white"
                            }`}
                            title="Edit Configuration"
                          >
                            <Pencil size={16} className="inline mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                            title="Delete Configuration"
                          >
                            <Trash2 size={16} className="inline mr-1" />
                            Delete
                          </button>
                          {deletingId === item.id && (
                            <>
                              <button
                                onClick={() => confirmDelete(item.id)}
                                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                                title="Confirm Delete"
                              >
                                <Check size={16} className="inline mr-1" />
                                Confirm
                              </button>
                              <button
                                onClick={cancelDelete}
                                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                                title="Cancel Delete"
                              >
                                <X size={16} className="inline mr-1" />
                                No
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>

          {/* Cards - Mobile & Tablet (below 900px) */}
          <div className="lg:hidden">
            {apis.length === 0 ? (
              <div className={`p-8 text-center rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  No APIs created yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
            {apis.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl p-4 shadow-sm ${
                  darkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p
                        className={`text-xs font-medium ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Category
                      </p>
                      <p
                        className={`text-base font-semibold ${
                          darkMode ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        {item.category}
                      </p>
                    </div>
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        item.is_active
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {item.is_active ? "Active" : "Disabled"}
                    </span>
                  </div>

                  <div>
                    <p
                      className={`text-xs font-medium ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Provider
                    </p>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-200" : "text-gray-900"
                      }`}
                    >
                      {item.provider}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-xs font-medium ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Base URL
                    </p>
                    <p
                      className={`text-sm break-all ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {item.base_url}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {deletingId !== item.id && (
                      <>
                        <button
                          onClick={() => openView(item)}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            darkMode
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : "bg-blue-500 hover:bg-blue-600 text-white"
                          }`}
                        >
                          <Eye size={16} className="inline mr-1" />
                          View
                        </button>
                        <button
                          onClick={() => openEdit(item)}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            darkMode
                              ? "bg-amber-600 hover:bg-amber-700 text-white"
                              : "bg-amber-500 hover:bg-amber-600 text-white"
                          }`}
                        >
                          <Pencil size={16} className="inline mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                    {deletingId === item.id && (
                      <>
                        <button
                          onClick={() => confirmDelete(item.id)}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex-1"
                        >
                          <Check size={16} className="inline mr-1" />
                          Confirm
                        </button>
                        <button
                          onClick={cancelDelete}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex-1"
                        >
                          <X size={16} className="inline mr-1" />
                          No
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Form View (Add/Edit/View)
  const isViewMode = currentView === "view";
  const isEditMode = currentView === "edit";

  return (
    <div className={`mb-6`}>
      <div className="">
        {/* Back Button & Header */}
        <div className="mb-6">
          <button
            onClick={backToList}
            className={`flex items-center gap-2 mb-4 text-sm font-medium transition-colors ${
              darkMode
                ? "text-gray-300 hover:text-gray-100"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <ChevronLeft size={20} />
            Back to List
          </button>
          <h1
            className={`text-2xl md:text-3xl font-bold ${
              darkMode ? "text-gray-100" : "text-gray-900"
            }`}
          >
            {isViewMode
              ? "View API Configuration"
              : isEditMode
              ? "Edit API Configuration"
              : "Add New API Configuration"}
          </h1>
        </div>

        {/* Form Container with Scroll */}
        <div
          className={`rounded-xl shadow-sm overflow-hidden ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <div className="p-6">
            <div className="space-y-6">
              {/* Basic Info - 2 Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput
                  label="Category"
                  placeholder="e.g., ai, weather, payment"
                  value={formData.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                  disabled={isViewMode}
                  required
                />
                <TextInput
                  label="Provider"
                  placeholder="e.g., Gemini API, OpenAI"
                  value={formData.provider}
                  onChange={(e) => handleInputChange("provider", e.target.value)}
                  disabled={isViewMode}
                  required
                />
              </div>

              {/* URLs & Keys - 2 Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput
                  label="Base URL"
                  placeholder="https://api.example.com"
                  value={formData.base_url}
                  onChange={(e) => handleInputChange("base_url", e.target.value)}
                  disabled={isViewMode}
                />
                <TextInput
                  label="API Key"
                  placeholder="Enter API key (optional)"
                  type={isViewMode ? "text" : "password"}
                  value={formData.api_key}
                  onChange={(e) => handleInputChange("api_key", e.target.value)}
                  disabled={isViewMode}
                />
              </div>

              {/* Status Toggle */}
              <div>
                <label
                  className={`block text-sm font-semibold mb-2 ${
                    darkMode ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  Status
                </label>
                <div className="flex items-center gap-3">
                  <button
                    disabled={isViewMode}
                    onClick={() => handleInputChange("is_active", !formData.is_active)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.is_active ? "bg-green-600" : "bg-gray-400"
                    } ${isViewMode ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.is_active ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span
                    className={`text-sm font-medium ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {formData.is_active ? "Active" : "Disabled"}
                  </span>
                </div>
              </div>

              {/* Extra Configuration */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label
                    className={`block text-sm font-semibold ${
                      darkMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    Extra Configuration
                  </label>
                  {!isViewMode && (
                    <button
                      onClick={addConfigField}
                      className={`text-sm font-medium flex items-center gap-1 transition-colors ${
                        darkMode
                          ? "text-green-400 hover:text-green-300"
                          : "text-green-600 hover:text-green-700"
                      }`}
                    >
                      <Plus size={16} /> Add Field
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {formData.extra_config.length === 0 ? (
                    <p
                      className={`text-sm italic py-4 px-4 rounded-lg ${
                        darkMode ? "text-gray-500 bg-gray-700/30" : "text-gray-400 bg-gray-50"
                      }`}
                    >
                      No extra configuration fields. {!isViewMode && 'Click "Add Field" to add one.'}
                    </p>
                  ) : (
                    formData.extra_config.map((field, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <TextInput
                          placeholder="Key"
                          value={field.key}
                          onChange={(e) => updateConfigField(index, "key", e.target.value)}
                          disabled={isViewMode}
                        />
                        <div className="flex gap-2">
                          <TextInput
                            placeholder="Value"
                            value={field.value}
                            onChange={(e) => updateConfigField(index, "value", e.target.value)}
                            disabled={isViewMode}
                          />
                          {!isViewMode && (
                            <button
                              onClick={() => removeConfigField(index)}
                              className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                                darkMode
                                  ? "text-red-400 hover:bg-red-900/20"
                                  : "text-red-600 hover:bg-red-50"
                              }`}
                              title="Remove field"
                            >
                              <X size={20} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Timestamps (View Mode Only) */}
              {isViewMode && selected && (
                <div
                  className={`p-4 rounded-lg ${
                    darkMode ? "bg-gray-700" : "bg-gray-50"
                  }`}
                >
                  <p
                    className={`text-xs font-semibold mb-3 ${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    Metadata
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p
                        className={`text-xs ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Created
                      </p>
                      <p
                        className={`text-sm font-medium ${
                          darkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                      >
                        {new Date(selected.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p
                        className={`text-xs ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Last Updated
                      </p>
                      <p
                        className={`text-sm font-medium ${
                          darkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                      >
                        {new Date(selected.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons - Sticky Footer */}
          <div
            className={`flex flex-col-reverse sm:flex-row justify-end gap-3 p-4 border-t ${
              darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
            }`}
          >
            <button
              onClick={backToList}
              className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
            >
              {isViewMode ? "Close" : "Cancel"}
            </button>
            {!isViewMode && (
              <button
                onClick={handleSave}
                className="px-5 py-2.5 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                {isEditMode ? "Update Configuration" : "Create Configuration"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;