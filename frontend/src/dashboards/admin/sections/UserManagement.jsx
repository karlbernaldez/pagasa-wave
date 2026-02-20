import { useMemo, useState } from 'react';
import { Building2, Mail, Phone, Plus, Search, ShieldCheck, UserCog, X } from 'lucide-react';

const INITIAL_USERS = [
  {
    id: 1,
    firstName: 'Ana',
    lastName: 'Reyes',
    email: 'ana.reyes@pagasa.gov.ph',
    contact: '+639171112233',
    agency: 'PAGASA Marine Division',
    position: 'Senior Forecaster',
    role: 'Forecaster',
    status: 'Active',
    memberSince: '2022-03-12',
    lastLogin: '2026-02-19 08:10',
  },
  {
    id: 2,
    firstName: 'Liam',
    lastName: 'Cruz',
    email: 'liam.cruz@pagasa.gov.ph',
    contact: '+639181234567',
    agency: 'PAGASA ICT',
    position: 'Platform Admin',
    role: 'Admin',
    status: 'Active',
    memberSince: '2021-07-05',
    lastLogin: '2026-02-19 09:35',
  },
  {
    id: 3,
    firstName: 'Maya',
    lastName: 'Santos',
    email: 'maya.santos@dost.gov.ph',
    contact: '+639209876543',
    agency: 'DOST Analytics Unit',
    position: 'Data Analyst',
    role: 'Data Analyst',
    status: 'Pending',
    memberSince: '2026-01-20',
    lastLogin: 'Never',
  },
  {
    id: 4,
    firstName: 'Noel',
    lastName: 'Aquino',
    email: 'noel.aquino@pagasa.gov.ph',
    contact: '+639151234567',
    agency: 'PAGASA Forecast Center',
    position: 'Forecaster',
    role: 'Forecaster',
    status: 'Suspended',
    memberSince: '2023-11-14',
    lastLogin: '2026-02-10 13:01',
  },
];

const ROLE_OPTIONS = ['Admin', 'Forecaster', 'Data Analyst'];
const STATUS_OPTIONS = ['All', 'Active', 'Pending', 'Suspended'];

const ROLE_DEFINITIONS = [
  { role: 'Admin', description: 'Full access to dashboard management and approvals', members: 4 },
  { role: 'Forecaster', description: 'Can prepare and submit forecast charts', members: 18 },
  { role: 'Data Analyst', description: 'Can review data quality and analytics', members: 10 },
];

const getStatusBadgeClasses = (status, isDarkMode) => {
  if (status === 'Active') return isDarkMode ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700';
  if (status === 'Pending') return isDarkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700';
  return isDarkMode ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700';
};

const defaultNewUser = () => ({
  firstName: '',
  lastName: '',
  email: '',
  contact: '',
  agency: '',
  position: '',
  role: 'Forecaster',
  status: 'Pending',
  memberSince: new Date().toISOString().slice(0, 10),
});

const fullName = (user) => `${user.firstName} ${user.lastName}`.trim();

const UserManagementSection = ({ isDarkMode, mode = 'list' }) => {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [manageUserId, setManageUserId] = useState(null);
  const [newUser, setNewUser] = useState(defaultNewUser());

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const queryMatch =
        fullName(user).toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase()) ||
        user.agency.toLowerCase().includes(query.toLowerCase()) ||
        user.position.toLowerCase().includes(query.toLowerCase()) ||
        user.role.toLowerCase().includes(query.toLowerCase()) ||
        user.status.toLowerCase().includes(query.toLowerCase());

      const isStatusMatch = statusFilter === 'All' ? true : user.status === statusFilter;
      return queryMatch && isStatusMatch;
    });
  }, [users, query, statusFilter]);

  const createUser = () => {
    if (!newUser.firstName.trim() || !newUser.lastName.trim() || !newUser.email.trim()) return;

    setUsers((prev) => [
      {
        id: Date.now(),
        ...newUser,
        firstName: newUser.firstName.trim(),
        lastName: newUser.lastName.trim(),
        email: newUser.email.trim(),
        lastLogin: 'Never',
      },
      ...prev,
    ]);

    setNewUser(defaultNewUser());
    setIsAddModalOpen(false);
  };

  const updateUser = (userId, field, value) => {
    setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, [field]: value } : user)));
  };

  const managedUser = users.find((item) => item.id === manageUserId);

  if (mode === 'roles') {
    return (
      <div className={`rounded-2xl border p-6 space-y-4 ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/90 border-gray-200'}`}>
        <div>
          <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Roles & Permissions</h3>
          <p className={isDarkMode ? 'text-gray-400 mt-1' : 'text-gray-600 mt-1'}>
            Configure available user roles and quickly review membership counts.
          </p>
        </div>

        {ROLE_DEFINITIONS.map((item) => (
          <div key={item.role} className={`rounded-xl border p-4 ${isDarkMode ? 'border-gray-700 bg-gray-900/40' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <ShieldCheck size={18} className={isDarkMode ? 'text-cyan-300 mt-0.5' : 'text-cyan-700 mt-0.5'} />
                <div>
                  <p className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{item.role}</p>
                  <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.description}</p>
                </div>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isDarkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                {item.members} members
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/90 border-gray-200'}`}>
      <div className="p-6 border-b border-gray-200/20 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>User List</h3>
          <p className={isDarkMode ? 'text-gray-400 mt-1' : 'text-gray-600 mt-1'}>
            Registration-based profile columns (name, email, contact, agency, position) plus admin controls.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white inline-flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_190px] gap-3 mb-5">
          <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-white border-gray-200'}`}>
            <Search size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, email, agency, role"
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
          <table className="w-full min-w-[1220px] text-sm">
            <thead>
              <tr className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                <th className="text-left py-3">Profile</th>
                <th className="text-left py-3">Contact</th>
                <th className="text-left py-3">Agency & Position</th>
                <th className="text-left py-3">Role</th>
                <th className="text-left py-3">Status</th>
                <th className="text-left py-3">Member Since</th>
                <th className="text-left py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className={`border-t align-top ${isDarkMode ? 'border-gray-700/70 text-gray-100' : 'border-gray-200 text-gray-800'}`}>
                  <td className="py-3 pr-2">
                    <p className="font-semibold">{fullName(user)}</p>
                    <p className={`text-xs mt-1 inline-flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}><Mail size={12} />{user.email}</p>
                  </td>
                  <td className="py-3 pr-2">
                    <p className={`inline-flex items-center gap-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}><Phone size={12} />{user.contact || '—'}</p>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Last login: {user.lastLogin}</p>
                  </td>
                  <td className="py-3 pr-2">
                    <p className={`inline-flex items-center gap-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}><Building2 size={12} />{user.agency || '—'}</p>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{user.position || '—'}</p>
                  </td>
                  <td className="py-3 pr-2">
                    <select
                      value={user.role}
                      onChange={(event) => updateUser(user.id, 'role', event.target.value)}
                      className={`px-2 py-1 rounded-lg border ${isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-white border-gray-200'}`}
                    >
                      {ROLE_OPTIONS.map((role) => <option key={role}>{role}</option>)}
                    </select>
                  </td>
                  <td className="py-3 pr-2">
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
                    <button
                      onClick={() => setManageUserId(user.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500 hover:bg-blue-600 text-white inline-flex items-center gap-1"
                    >
                      <UserCog size={14} /> Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl rounded-2xl border p-6 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h4 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Add User</h4>
              <button onClick={() => setIsAddModalOpen(false)} className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}><X size={16} /></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={newUser.firstName} onChange={(e) => setNewUser((prev) => ({ ...prev, firstName: e.target.value }))} placeholder="First name" className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-800'}`} />
              <input value={newUser.lastName} onChange={(e) => setNewUser((prev) => ({ ...prev, lastName: e.target.value }))} placeholder="Last name" className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-800'}`} />
              <input type="email" value={newUser.email} onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))} placeholder="Email" className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-800'}`} />
              <input value={newUser.contact} onChange={(e) => setNewUser((prev) => ({ ...prev, contact: e.target.value }))} placeholder="Contact number" className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-800'}`} />
              <input value={newUser.agency} onChange={(e) => setNewUser((prev) => ({ ...prev, agency: e.target.value }))} placeholder="Agency" className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-800'}`} />
              <input value={newUser.position} onChange={(e) => setNewUser((prev) => ({ ...prev, position: e.target.value }))} placeholder="Position" className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-800'}`} />
              <select value={newUser.role} onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value }))} className={`px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-800'}`}>
                {ROLE_OPTIONS.map((role) => <option key={role}>{role}</option>)}
              </select>
              <select value={newUser.status} onChange={(e) => setNewUser((prev) => ({ ...prev, status: e.target.value }))} className={`px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-800'}`}>
                {STATUS_OPTIONS.filter((option) => option !== 'All').map((option) => <option key={option}>{option}</option>)}
              </select>
              <input type="date" value={newUser.memberSince} onChange={(e) => setNewUser((prev) => ({ ...prev, memberSince: e.target.value }))} className={`sm:col-span-2 w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-800'}`} />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setIsAddModalOpen(false)} className={`px-3 py-2 rounded-lg border ${isDarkMode ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-700'}`}>Cancel</button>
              <button onClick={createUser} className="px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white">Create User</button>
            </div>
          </div>
        </div>
      )}

      {manageUserId && managedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h4 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Manage User</h4>
              <button onClick={() => setManageUserId(null)} className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}><X size={16} /></button>
            </div>
            <div className="space-y-1">
              <p className={isDarkMode ? 'text-gray-100' : 'text-gray-900'}>{fullName(managedUser)}</p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{managedUser.email}</p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{managedUser.agency} • {managedUser.position}</p>
            </div>
            <p className={`text-sm mt-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Extend this dialog with reset password, lock/unlock account, and audit trail actions when backend endpoints are ready.
            </p>
            <div className="mt-5 flex justify-end">
              <button onClick={() => setManageUserId(null)} className="px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementSection;
