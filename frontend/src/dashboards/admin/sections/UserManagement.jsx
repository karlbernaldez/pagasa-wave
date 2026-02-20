import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';

const INITIAL_USERS = [
  { id: 1, name: 'Ana Reyes', role: 'Forecaster', status: 'Active', memberSince: '2022-03-12', lastLogin: '2026-02-19 08:10' },
  { id: 2, name: 'Liam Cruz', role: 'Admin', status: 'Active', memberSince: '2021-07-05', lastLogin: '2026-02-19 09:35' },
  { id: 3, name: 'Maya Santos', role: 'Data Analyst', status: 'Pending', memberSince: '2026-01-20', lastLogin: 'Never' },
  { id: 4, name: 'Noel Aquino', role: 'Forecaster', status: 'Suspended', memberSince: '2023-11-14', lastLogin: '2026-02-10 13:01' },
  { id: 5, name: 'Gia Dela Cruz', role: 'Forecaster', status: 'Pending', memberSince: '2026-02-01', lastLogin: 'Never' },
  { id: 6, name: 'Rafael Lim', role: 'Data Analyst', status: 'Active', memberSince: '2024-06-18', lastLogin: '2026-02-18 20:22' },
];

const ROLE_OPTIONS = ['Admin', 'Forecaster', 'Data Analyst'];
const STATUS_OPTIONS = ['All', 'Active', 'Pending', 'Suspended'];

const getRoleBadgeClasses = (role, isDarkMode) => {
  if (role === 'Admin') return isDarkMode ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-100 text-purple-700';
  if (role === 'Forecaster') return isDarkMode ? 'bg-cyan-900/40 text-cyan-300' : 'bg-cyan-100 text-cyan-700';
  return isDarkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700';
};

const getStatusBadgeClasses = (status, isDarkMode) => {
  if (status === 'Active') return isDarkMode ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700';
  if (status === 'Pending') return isDarkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700';
  return isDarkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700';
};

const UserManagementSection = ({ isDarkMode, view = 'existing' }) => {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(view === 'pending' ? 'Pending' : 'All');
  const [newUser, setNewUser] = useState({ name: '', role: 'Forecaster' });

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const queryMatch =
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.role.toLowerCase().includes(query.toLowerCase()) ||
        user.status.toLowerCase().includes(query.toLowerCase());

      const isViewMatch = view === 'pending' ? user.status === 'Pending' : true;
      const isStatusMatch = statusFilter === 'All' ? true : user.status === statusFilter;

      return queryMatch && isStatusMatch && isViewMatch;
    });
  }, [users, query, statusFilter, view]);

  const createUser = () => {
    if (!newUser.name.trim()) return;

    setUsers((prev) => [
      {
        id: Date.now(),
        name: newUser.name.trim(),
        role: newUser.role,
        status: 'Pending',
        memberSince: new Date().toISOString().slice(0, 10),
        lastLogin: 'Never',
      },
      ...prev,
    ]);
    setNewUser({ name: '', role: 'Forecaster' });
  };

  const updateUser = (userId, field, value) => {
    setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, [field]: value } : user)));
  };

  return (
    <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/90 border-gray-200'}`}>
      <div className="p-6 border-b border-gray-200/20 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {view === 'pending' ? 'Pending User Requests' : 'User Management'}
            </h3>
            <p className={isDarkMode ? 'text-gray-400 mt-1' : 'text-gray-600 mt-1'}>
              Fully editable user table with role, status, member since, and last login.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_180px] gap-3">
          <input
            value={newUser.name}
            onChange={(event) => setNewUser((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="New user full name"
            className={`px-4 py-2.5 rounded-xl border text-sm outline-none ${isDarkMode ? 'bg-gray-900/50 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-700'}`}
          />
          <select
            value={newUser.role}
            onChange={(event) => setNewUser((prev) => ({ ...prev, role: event.target.value }))}
            className={`px-3 py-2.5 rounded-xl border text-sm outline-none ${isDarkMode ? 'bg-gray-900/50 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-700'}`}
          >
            {ROLE_OPTIONS.map((role) => <option key={role}>{role}</option>)}
          </select>
          <button
            onClick={createUser}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white inline-flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Add User
          </button>
        </div>
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
            {STATUS_OPTIONS.map((option) => <option key={option}>{option}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                <th className="text-left py-3">Name</th>
                <th className="text-left py-3">Role</th>
                <th className="text-left py-3">Status</th>
                <th className="text-left py-3">Member Since</th>
                <th className="text-left py-3">Last Login</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className={`border-t ${isDarkMode ? 'border-gray-700/70 text-gray-100' : 'border-gray-200 text-gray-800'}`}>
                  <td className="py-3 font-semibold">{user.name}</td>
                  <td className="py-3">
                    <select
                      value={user.role}
                      onChange={(event) => updateUser(user.id, 'role', event.target.value)}
                      className={`px-2 py-1 rounded-lg border ${isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-white border-gray-200'}`}
                    >
                      {ROLE_OPTIONS.map((role) => <option key={role}>{role}</option>)}
                    </select>
                  </td>
                  <td className="py-3">
                    <select
                      value={user.status}
                      onChange={(event) => updateUser(user.id, 'status', event.target.value)}
                      className={`px-2 py-1 rounded-lg border ${isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-white border-gray-200'}`}
                    >
                      {STATUS_OPTIONS.filter((option) => option !== 'All').map((option) => <option key={option}>{option}</option>)}
                    </select>
                    <span className={`ml-2 text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusBadgeClasses(user.status, isDarkMode)}`}>{user.status}</span>
                  </td>
                  <td className="py-3">{user.memberSince}</td>
                  <td className="py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getRoleBadgeClasses(user.role, isDarkMode)}`}>
                      {user.lastLogin}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className={`rounded-xl border p-6 text-center mt-4 ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
            No users found for the selected filters.
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementSection;
