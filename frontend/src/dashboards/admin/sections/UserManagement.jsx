import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';

const USERS = [
  { name: 'Ana Reyes', role: 'Forecaster', status: 'Active' },
  { name: 'Liam Cruz', role: 'Admin', status: 'Active' },
  { name: 'Maya Santos', role: 'Data Analyst', status: 'Pending' },
  { name: 'Noel Aquino', role: 'Forecaster', status: 'Suspended' },
  { name: 'Gia Dela Cruz', role: 'Forecaster', status: 'Pending' },
  { name: 'Rafael Lim', role: 'Data Analyst', status: 'Active' },
];

const getRoleBadgeClasses = (role, isDarkMode) => {
  if (role === 'Admin') {
    return isDarkMode ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-100 text-purple-700';
  }

  if (role === 'Forecaster') {
    return isDarkMode ? 'bg-cyan-900/40 text-cyan-300' : 'bg-cyan-100 text-cyan-700';
  }

  return isDarkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700';
};

const getStatusBadgeClasses = (status, isDarkMode) => {
  if (status === 'Active') {
    return isDarkMode ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700';
  }

  if (status === 'Pending') {
    return isDarkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700';
  }

  return isDarkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700';
};

const FILTER_OPTIONS = ['All', 'Active', 'Pending', 'Suspended'];

const UserManagementSection = ({ isDarkMode, view = 'existing' }) => {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(view === 'pending' ? 'Pending' : 'All');

  const filteredUsers = useMemo(() => {
    return USERS.filter((user) => {
      const queryMatch =
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.role.toLowerCase().includes(query.toLowerCase()) ||
        user.status.toLowerCase().includes(query.toLowerCase());

      const isViewMatch = view === 'pending' ? user.status === 'Pending' : user.status !== 'Pending' || statusFilter === 'Pending';
      const isStatusMatch = statusFilter === 'All' ? true : user.status === statusFilter;

      return queryMatch && isStatusMatch && isViewMatch;
    });
  }, [query, statusFilter, view]);

  return (
    <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/90 border-gray-200'}`}>
      <div className="p-6 border-b border-gray-200/20 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {view === 'pending' ? 'Pending User Requests' : 'User Management'}
          </h3>
          <p className={isDarkMode ? 'text-gray-400 mt-1' : 'text-gray-600 mt-1'}>
            Search, filter, and manage user accounts from a single admin workspace.
          </p>
        </div>

        <button className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white transition-colors inline-flex items-center gap-2">
          <Plus size={16} />
          Add User
        </button>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_190px] gap-3 mb-5">
          <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-white border-gray-200'}`}>
            <Search size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, role, or status"
              className={`w-full bg-transparent text-sm outline-none ${isDarkMode ? 'text-gray-100 placeholder:text-gray-500' : 'text-gray-800 placeholder:text-gray-400'}`}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={`px-3 py-2.5 rounded-xl border text-sm outline-none ${isDarkMode ? 'bg-gray-900/50 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-700'}`}
          >
            {FILTER_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <div
              key={`${user.name}-${user.role}`}
              className={`p-4 rounded-xl flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/60'}`}
            >
              <div>
                <p className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{user.name}</p>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getRoleBadgeClasses(user.role, isDarkMode)}`}>
                    {user.role}
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusBadgeClasses(user.status, isDarkMode)}`}>
                    {user.status}
                  </span>
                </div>
              </div>

              <button className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white transition-colors">
                Manage User
              </button>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div className={`rounded-xl border p-6 text-center ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
              No users found for the selected filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagementSection;
