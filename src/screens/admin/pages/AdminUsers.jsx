import React, { useContext, useState } from "react";
import { Eye, X } from "lucide-react";
import { DarkModeContext } from "../../DashboardLayout";

const mockUsers = [
  { id: 1, name: "Aisha Khan", phone: "+92 300 1234567", email: "aisha@example.com", is_active: true, joined_at: "2024-06-12T10:15:00Z" },
  { id: 2, name: "Bilal Ahmed", phone: "+92 312 9876543", email: "bilal@example.com", is_active: false, joined_at: "2023-11-04T09:00:00Z" },
  { id: 3, name: "Sana Iqbal", phone: "+92 301 5553344", email: "sana@example.com", is_active: true, joined_at: "2025-01-02T13:30:00Z" },
];

const AdminUsers = () => {
  const darkMode = useContext(DarkModeContext);
  const [users, setUsers] = useState(mockUsers);
  const [selected, setSelected] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);

  const toggleActive = (id) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_active: !u.is_active } : u)));
    if (selected?.id === id) setSelected((s) => ({ ...s, is_active: !s.is_active }));
  };

  const openView = (user) => {
    setSelected(user);
    setViewOpen(true);
  };

  const closeView = () => {
    setViewOpen(false);
    setSelected(null);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className={`text-2xl md:text-3xl font-bold ${darkMode ? "text-gray-100" : "text-gray-900"}`}>Users</h1>
      </div>

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
                  <td className={`px-6 py-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{new Date(u.joined_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openView(u)} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${darkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"}`} title="View Details"><Eye size={16} className="inline mr-1"/> View</button>
                      <button onClick={() => toggleActive(u.id)} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${u.is_active ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}`} title={u.is_active ? "Disable user" : "Enable user"}>{u.is_active ? "Disable" : "Enable"}</button>
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
                <button onClick={() => toggleActive(u.id)} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${u.is_active ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}`}>{u.is_active ? "Disable" : "Enable"}</button>
              </div>
            </div>
          </div>
        ))}
      </div>

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
                <p className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{selected.email}</p>
              </div>
              <div>
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Joined</p>
                <p className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{new Date(selected.joined_at).toLocaleString()}</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => { toggleActive(selected.id); closeView(); }} className={`px-4 py-2 rounded-md font-medium ${selected.is_active ? "bg-amber-500 text-white" : "bg-gray-200 text-gray-700"}`}>{selected.is_active ? "Disable" : "Enable"}</button>
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

