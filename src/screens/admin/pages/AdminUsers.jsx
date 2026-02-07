import React, { useContext, useState, useEffect } from "react";
import { Eye, X } from "lucide-react";
import axios from "axios";
import Helpers from "../../../config/Helpers";
import { DarkModeContext } from "../../DashboardLayout";

const AdminUsers = () => {
  const darkMode = useContext(DarkModeContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${Helpers.apiUrl}users`, Helpers.getAuthHeaders());
      if (res.data?.success && Array.isArray(res.data.users)) {
        setUsers(res.data.users);
      } else {
        setUsers([]);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleActive = async (id) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    const nextActive = !user.is_active;
    setTogglingId(id);
    try {
      const res = await axios.patch(
        `${Helpers.apiUrl}users/${id}`,
        { is_active: nextActive },
        Helpers.getAuthHeaders()
      );
      if (res.data?.success) {
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_active: nextActive } : u)));
        if (selected?.id === id) setSelected((s) => ({ ...s, is_active: nextActive }));
        Helpers.toast("success", res.data.detail || "User status updated");
      }
    } catch (err) {
      Helpers.toast("error", err.response?.data?.detail || "Failed to update user");
    } finally {
      setTogglingId(null);
    }
  };

  const formatJoined = (joined_at) =>
    joined_at ? new Date(joined_at).toLocaleDateString() : "—";
  const formatJoinedLong = (joined_at) =>
    joined_at ? new Date(joined_at).toLocaleString() : "—";

  const openView = (user) => {
    setSelected(user);
    setViewOpen(true);
  };

  const closeView = () => {
    setViewOpen(false);
    setSelected(null);
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <h1 className={`text-2xl md:text-3xl font-bold mb-6 ${darkMode ? "text-gray-100" : "text-gray-900"}`}>Users</h1>
        <p className={`${darkMode ? "text-red-400" : "text-red-600"}`}>{error}</p>
        <button onClick={fetchUsers} className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Retry</button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className={`text-2xl md:text-3xl font-bold ${darkMode ? "text-gray-100" : "text-gray-900"}`}>Users</h1>
      </div>

      {users.length === 0 ? (
        <p className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>No users found.</p>
      ) : (
        <>
      {/* Desktop Table */}
      <div className={`hidden lg:block rounded-xl overflow-hidden shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className={`${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-50 text-gray-600"}`}>
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-sm">Name</th>
                <th className="text-left px-6 py-3 font-semibold text-sm">Phone</th>
                <th className="text-left px-6 py-3 font-semibold text-sm">Status</th>
                <th className="text-left px-6 py-3 font-semibold text-sm">Joined</th>
                <th className="text-right px-6 py-3 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={`border-t ${darkMode ? "border-gray-700 hover:bg-gray-750" : "border-gray-200 hover:bg-gray-50"} transition-colors`}>
                  <td className={`px-6 py-4 font-medium ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{u.name}</td>
                  <td className={`px-6 py-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{u.phone}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${u.is_active ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}>{u.is_active ? "Active" : "Inactive"}</span>
                  </td>
                  <td className={`px-6 py-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{formatJoined(u.joined_at)}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openView(u)} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${darkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"}`} title="View Details"><Eye size={16} className="inline mr-1"/> View</button>
                      <button onClick={() => toggleActive(u.id)} disabled={togglingId === u.id} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${u.is_active ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}`} title={u.is_active ? "Disable user" : "Enable user"}>{togglingId === u.id ? "…" : u.is_active ? "Disable" : "Enable"}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile / Tablet Cards */}
      <div className="lg:hidden space-y-4">
        {users.map((u) => (
          <div key={u.id} className={`rounded-xl p-4 shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="space-y-3">
                <div className="flex items-start justify-between">
                <div>
                  <p className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Name</p>
                  <p className={`text-base font-semibold ${darkMode ? "text-gray-100" : "text-gray-900"}`}>{u.name}</p>
                </div>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${u.is_active ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}>{u.is_active ? "Active" : "Inactive"}</span>
              </div>

              <div>
                <p className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Phone</p>
                <p className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{u.phone}</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => openView(u)} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${darkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"}`}><Eye size={16} className="inline mr-1"/> View Details</button>
                <button onClick={() => toggleActive(u.id)} disabled={togglingId === u.id} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${u.is_active ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}`}>{togglingId === u.id ? "…" : u.is_active ? "Disable" : "Enable"}</button>
              </div>
            </div>
          </div>
        ))}
      </div>
        </>
      )}

      {/* View Modal (used on mobile/cards) */}
      {viewOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeView} />
          <div className={`relative w-full max-w-md mx-auto rounded-xl shadow-xl overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="p-4 border-b" style={{ borderColor: darkMode ? 'rgba(55,65,81,1)' : undefined }}>
              <div className="flex items-center justify-between">
                <h2 className={`text-lg font-semibold ${darkMode ? "text-gray-100" : "text-gray-900"}`}>User Details</h2>
                <button onClick={closeView} className={`p-2 rounded-md ${darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-50"}`}><X size={18} /></button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Name</p>
                <p className={`text-sm font-medium ${darkMode ? "text-gray-100" : "text-gray-900"}`}>{selected.name}</p>
              </div>
              <div>
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Phone</p>
                <p className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{selected.phone}</p>
              </div>
              <div>
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Email</p>
                <p className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{selected.email ?? "—"}</p>
              </div>
              <div>
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Joined</p>
                <p className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{formatJoinedLong(selected.joined_at)}</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => { toggleActive(selected.id); closeView(); }} disabled={togglingId === selected.id} className={`px-4 py-2 rounded-md font-medium disabled:opacity-50 ${selected.is_active ? "bg-amber-500 text-white" : "bg-gray-200 text-gray-700"}`}>{togglingId === selected.id ? "…" : selected.is_active ? "Disable" : "Enable"}</button>
                <button onClick={closeView} className={`px-4 py-2 rounded-md font-medium ${darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-700"}`}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;

