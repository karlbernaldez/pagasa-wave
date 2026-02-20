const USERS = [
  { name: 'Ana Reyes', role: 'Forecaster', status: 'Active' },
  { name: 'Liam Cruz', role: 'Admin', status: 'Active' },
  { name: 'Maya Santos', role: 'Data Analyst', status: 'Pending' },
  { name: 'Noel Aquino', role: 'Forecaster', status: 'Suspended' },
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

const UserManagementSection = ({ isDarkMode }) => (
  <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/80 border-gray-200'}`}>
    <div className="p-6 border-b border-gray-200/20">
      <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>User Management</h3>
      <p className={isDarkMode ? 'text-gray-400 mt-1' : 'text-gray-600 mt-1'}>
        Manage all user types including Forecasters, Admins, and other platform roles.
      </p>
    </div>

    <div className="p-6 space-y-4">
      {USERS.map((user) => (
        <div
          key={`${user.name}-${user.role}`}
          className={`p-4 rounded-xl flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100/60'}`}
        >
          <div>
            <p className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{user.name}</p>
            <div className="mt-2 flex items-center gap-2">
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
    </div>
  </div>
);

export default UserManagementSection;
