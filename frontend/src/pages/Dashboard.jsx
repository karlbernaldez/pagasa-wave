import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  MapPin,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
  Moon,
  Sun,
  Check,
  XCircle,
  AlertCircle,
  Eye,
  Download,
  Clock,
  Zap,
  ChevronDown,
  LogOut,
  User,
  TrendingUp,
  Activity,
  Waves
} from 'lucide-react';

// Helper functions
const getUserInitials = (firstName, lastName, username) => {
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  if (username) {
    return username.slice(0, 2).toUpperCase();
  }
  return 'U';
};

const getFullName = (firstName, lastName, username) => {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  if (username) {
    return username;
  }
  return 'User';
};

// Mock API functions
const fetchUserDetails = async (userId) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        id: userId,
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        email: 'john@example.com',
        role: 'admin'
      });
    }, 500);
  });
};

const logoutUser = async () => {
  try {
    console.log('User logged out');
  } catch (error) {
    console.error('Logout error:', error);
  }
};

// Stat Card Component with Enhanced Design
const StatCard = ({ title, value, change, color, icon: Icon, darkMode, trend }) => {
  const colorClasses = {
    blue: darkMode ? 'from-blue-600/20 to-cyan-600/20 text-blue-400' : 'from-blue-50 to-cyan-50 text-blue-600',
    green: darkMode ? 'from-emerald-600/20 to-teal-600/20 text-emerald-400' : 'from-emerald-50 to-teal-50 text-emerald-600',
    amber: darkMode ? 'from-amber-600/20 to-orange-600/20 text-amber-400' : 'from-amber-50 to-orange-50 text-amber-600',
    red: darkMode ? 'from-red-600/20 to-pink-600/20 text-red-400' : 'from-red-50 to-pink-50 text-red-600'
  };

  const textColor = {
    blue: darkMode ? 'text-blue-300' : 'text-blue-600',
    green: darkMode ? 'text-green-300' : 'text-green-600',
    amber: darkMode ? 'text-amber-300' : 'text-amber-600',
    red: darkMode ? 'text-red-300' : 'text-red-600'
  };

  return (
    <div className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
      darkMode 
        ? 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600' 
        : 'bg-white/50 border-white/50 backdrop-blur-sm hover:border-gray-200'
    }`}>
      {/* Gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-40 group-hover:opacity-60 transition-opacity duration-300`}></div>
      
      {/* Animated corner accent */}
      <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${
        color === 'blue' ? 'bg-blue-400' : color === 'green' ? 'bg-green-400' : color === 'amber' ? 'bg-amber-400' : 'bg-red-400'
      }`}></div>

      <div className="relative p-6 z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className={`text-sm font-medium tracking-wide uppercase ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {title}
            </p>
            <p className={`text-4xl font-bold mt-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {value}
            </p>
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} transition-transform duration-300 group-hover:scale-110`}>
            <Icon size={28} className={textColor[color]} />
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200/20">
          <TrendingUp size={16} className={trend === 'up' ? textColor[color] : darkMode ? 'text-red-400' : 'text-red-600'} />
          <span className={`text-sm font-semibold ${trend === 'up' ? textColor[color] : darkMode ? 'text-red-400' : 'text-red-600'}`}>
            {change}
          </span>
        </div>
      </div>
    </div>
  );
};

// Enhanced Dashboard
const DashboardContent = ({ darkMode }) => (
  <div className="space-y-8">
    {/* Header Section */}
    <div className="flex items-end justify-between">
      <div>
        <p className={`text-sm font-semibold uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Welcome back
        </p>
        <h1 className={`text-3xl md:text-4xl font-bold mt-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Wave Forecast Dashboard
        </h1>
      </div>
      <span className={`text-sm font-medium px-4 py-2 rounded-full ${darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'}`}>
        System Healthy
      </span>
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Total Charts" value="284" change="+12% this week" color="blue" icon={MapPin} darkMode={darkMode} trend="up" />
      <StatCard title="Pending Review" value="23" change="+5 new" color="amber" icon={Clock} darkMode={darkMode} trend="up" />
      <StatCard title="Approved" value="247" change="+18% approval" color="green" icon={Check} darkMode={darkMode} trend="up" />
      <StatCard title="Rejected" value="14" change="+2 flagged" color="red" icon={XCircle} darkMode={darkMode} trend="down" />
    </div>

    {/* Content Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Recent Submissions */}
      <div className={`lg:col-span-2 rounded-2xl border backdrop-blur-sm transition-all ${
        darkMode 
          ? 'bg-gray-800/50 border-gray-700/50' 
          : 'bg-white/50 border-white/50'
      }`}>
        <div className="px-8 py-6 border-b border-gray-200/20 flex items-center justify-between">
          <div>
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recent Submissions</h3>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Latest wave chart uploads</p>
          </div>
          <Activity size={24} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
        </div>
        <div className="p-8 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 hover:translate-x-1 ${
                darkMode
                  ? 'bg-gray-700/30 hover:bg-gray-700/50'
                  : 'bg-gray-100/50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center text-white font-bold ${
                  i % 2 === 0 
                    ? 'from-blue-400 to-cyan-500' 
                    : 'from-purple-400 to-pink-500'
                }`}>
                  {i}
                </div>
                <div>
                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Wave Chart #{i}</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Forecaster {i} • {2 + i}h ago</p>
                </div>
              </div>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-lg backdrop-blur-sm ${
                i === 1
                  ? darkMode
                    ? 'bg-amber-900/30 text-amber-300'
                    : 'bg-amber-100/80 text-amber-700'
                  : darkMode
                  ? 'bg-emerald-900/30 text-emerald-300'
                  : 'bg-emerald-100/80 text-emerald-700'
              }`}>
                {i === 1 ? '⏳ Pending' : '✓ Approved'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Review Status Card */}
      <div className={`rounded-2xl border backdrop-blur-sm transition-all ${
        darkMode 
          ? 'bg-gray-800/50 border-gray-700/50' 
          : 'bg-white/50 border-white/50'
      }`}>
        <div className="px-8 py-6 border-b border-gray-200/20">
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Review Status</h3>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>This week's activity</p>
        </div>
        <div className="p-8 space-y-3">
          {[
            { label: 'Approved', value: 45, color: 'emerald', icon: Check },
            { label: 'Pending', value: 23, color: 'amber', icon: Clock },
            { label: 'Rejected', value: 14, color: 'red', icon: XCircle }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className={`group p-4 rounded-xl transition-all cursor-pointer ${
                darkMode
                  ? 'bg-gray-700/30 hover:bg-gray-700/50'
                  : 'bg-gray-100/50 hover:bg-gray-100'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon size={16} className={
                      item.color === 'emerald' ? darkMode ? 'text-emerald-400' : 'text-emerald-600' :
                      item.color === 'amber' ? darkMode ? 'text-amber-400' : 'text-amber-600' :
                      darkMode ? 'text-red-400' : 'text-red-600'
                    } />
                    <p className={`font-medium text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.label}</p>
                  </div>
                  <span className={`text-lg font-bold ${
                    item.color === 'emerald' ? darkMode ? 'text-emerald-400' : 'text-emerald-600' :
                    item.color === 'amber' ? darkMode ? 'text-amber-400' : 'text-amber-600' :
                    darkMode ? 'text-red-400' : 'text-red-600'
                  }`}>{item.value}</span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}>
                  <div className={`h-full rounded-full transition-all duration-500 ${
                    item.color === 'emerald' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' :
                    item.color === 'amber' ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                    'bg-gradient-to-r from-red-400 to-pink-500'
                  }`} style={{width: `${(item.value / 45) * 100}%`}}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </div>
);

// Enhanced Chart Review Page
const ChartReviewPage = ({ darkMode }) => (
  <div className="space-y-8">
    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
      <div>
        <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Wave Charts Review</h2>
        <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Review and approve submitted forecasts</p>
      </div>
      <select className={`px-4 py-2 rounded-xl border font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        darkMode
          ? 'bg-gray-800 border-gray-700 text-white'
          : 'bg-white border-gray-300 text-gray-900'
      }`}>
        <option>All Status</option>
        <option>Pending</option>
        <option>Approved</option>
        <option>Rejected</option>
      </select>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className={`group overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
            darkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-white/50'
          }`}
        >
          {/* Chart Preview */}
          <div className="h-48 bg-gradient-to-br from-blue-400 via-cyan-300 to-teal-400 relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
            <svg className="w-full h-full" viewBox="0 0 300 150">
              <defs>
                <linearGradient id={`wave${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
              </defs>
              <path
                d="M0,50 Q75,20 150,50 T300,50"
                stroke="white"
                strokeWidth="2.5"
                fill="none"
              />
              <path
                d="M0,80 Q75,50 150,80 T300,80"
                stroke="white"
                strokeWidth="1.5"
                fill="none"
                opacity="0.7"
              />
              <path
                d="M0,110 Q75,80 150,110 T300,110"
                stroke="white"
                strokeWidth="1"
                fill="none"
                opacity="0.5"
              />
            </svg>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs text-white font-bold border border-white/20">
              {2 + i * 0.5}m
            </div>
          </div>

          {/* Chart Info */}
          <div className={`p-6 ${darkMode ? 'bg-gray-800/50' : 'bg-white/50'}`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Chart #{i}</h3>
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>John Doe</p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg backdrop-blur-sm ${
                i % 3 === 0
                  ? darkMode
                    ? 'bg-amber-900/30 text-amber-300'
                    : 'bg-amber-100/80 text-amber-700'
                  : i % 3 === 1
                  ? darkMode
                    ? 'bg-emerald-900/30 text-emerald-300'
                    : 'bg-emerald-100/80 text-emerald-700'
                  : darkMode
                  ? 'bg-red-900/30 text-red-300'
                  : 'bg-red-100/80 text-red-700'
              }`}>
                {i % 3 === 0 ? '⏳ Pending' : i % 3 === 1 ? '✓ Approved' : '✕ Rejected'}
              </span>
            </div>

            <div className={`text-xs space-y-2 mb-6 p-3 rounded-lg ${darkMode ? 'bg-gray-700/30' : 'bg-gray-100/50'}`}>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>📍 North Atlantic</p>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>🌊 {2 + i * 0.5}m • {8 + i}s period</p>
            </div>

            {/* Action Buttons */}
            {i % 3 === 0 && (
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-emerald-500/30">
                  <Check size={16} />
                  Approve
                </button>
                <button className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 border-2 ${
                  darkMode
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700/50'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}>
                  <AlertCircle size={16} />
                  Revise
                </button>
              </div>
            )}
            {i % 3 !== 0 && (
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-blue-500/30">
                  <Eye size={16} />
                  View
                </button>
                <button className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 border-2 ${
                  darkMode
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700/50'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}>
                  <Download size={16} className="mx-auto" />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Enhanced Forecaster Management
const ForecasterManagement = ({ darkMode }) => (
  <div className="space-y-8">
    <div>
      <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Forecaster Management</h2>
      <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage forecaster accounts and performance</p>
    </div>

    <div className={`rounded-2xl border backdrop-blur-sm overflow-hidden ${
      darkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-white/50'
    }`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={`border-b ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
              <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Name</th>
              <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email</th>
              <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Charts</th>
              <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Approval Rate</th>
              <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</th>
              <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Action</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className={`border-b transition-all duration-200 hover:${darkMode ? 'bg-gray-700/30' : 'bg-gray-100/50'} ${
                darkMode ? 'border-gray-700/30' : 'border-gray-200/30'
              }`}>
                <td className={`px-6 py-4 font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Forecaster {i}</td>
                <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>forecaster{i}@weather.com</td>
                <td className={`px-6 py-4 font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{50 + i * 10}</td>
                <td className={`px-6 py-4`}>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-20 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}>
                      <div className={`h-full rounded-full bg-gradient-to-r ${i <= 3 ? 'from-emerald-400 to-teal-500' : 'from-amber-400 to-orange-500'}`} style={{width: `${92 + i}%`}}></div>
                    </div>
                    <span className={`text-sm font-bold ${i <= 3 ? (darkMode ? 'text-emerald-400' : 'text-emerald-600') : (darkMode ? 'text-amber-400' : 'text-amber-600')}`}>{92 + i}%</span>
                  </div>
                </td>
                <td className={`px-6 py-4`}>
                  <span className={`text-xs font-bold px-3 py-1 rounded-lg backdrop-blur-sm ${
                    i !== 5
                      ? darkMode
                        ? 'bg-emerald-900/30 text-emerald-300'
                        : 'bg-emerald-100/80 text-emerald-700'
                      : darkMode
                      ? 'bg-red-900/30 text-red-300'
                      : 'bg-red-100/80 text-red-700'
                  }`}>
                    {i !== 5 ? '● Active' : '● Suspended'}
                  </span>
                </td>
                <td className={`px-6 py-4 text-sm font-semibold hover:underline cursor-pointer transition-colors ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
                  Edit
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// Enhanced Analytics Page
const AnalyticsPage = ({ darkMode }) => (
  <div className="space-y-8">
    <div>
      <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Analytics & Reports</h2>
      <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Detailed performance metrics and trends</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {['Submission Trends', 'Approval Statistics'].map((title, idx) => (
        <div key={idx} className={`rounded-2xl border backdrop-blur-sm overflow-hidden transition-all ${
          darkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-white/50'
        }`}>
          <div className="px-8 py-6 border-b border-gray-200/20">
            <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
          </div>
          <div className={`h-80 flex items-center justify-center ${darkMode ? 'bg-gray-700/20' : 'bg-gray-100/50'}`}>
            <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              📊 Chart will render here
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Enhanced Settings Page
const SettingsPage = ({ darkMode }) => (
  <div className="space-y-8">
    <div>
      <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>System Settings</h2>
      <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Configure your dashboard preferences</p>
    </div>

    <div className={`rounded-2xl border backdrop-blur-sm ${
      darkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-white/50'
    } p-8`}>
      <div className="space-y-8 max-w-2xl">
        {[
          { label: 'API Base URL', placeholder: 'https://api.example.com' },
          { label: 'Notification Email', placeholder: 'admin@example.com' },
          { label: 'Default Review Timeout', placeholder: '24 hours' }
        ].map((field, i) => (
          <div key={i}>
            <label className={`block text-sm font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {field.label}
            </label>
            <input
              type="text"
              placeholder={field.placeholder}
              className={`w-full px-4 py-3 rounded-xl border-2 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
        ))}
        <button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-3 rounded-xl font-bold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-blue-500/30">
          Save Changes
        </button>
      </div>
    </div>
  </div>
);

// Enhanced Sidebar
const Sidebar = ({ activeTab, setActiveTab, isMobileOpen, setIsMobileOpen, darkMode }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'charts', label: 'Review Charts', icon: Waves },
    { id: 'forecasters', label: 'Forecasters', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 w-64 transition-all duration-300 z-40 overflow-y-auto ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${darkMode 
          ? 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-b from-white via-gray-50 to-white'
        } border-r ${
          darkMode ? 'border-gray-700/50' : 'border-gray-200/50'
        } backdrop-blur-xl`}
      >
        <div className={`flex items-center justify-between p-6 border-b ${
          darkMode ? 'border-gray-700/30' : 'border-gray-200/30'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg hover:shadow-blue-500/50 transition-shadow">
              <Waves size={24} className="text-white" />
            </div>
            <div>
              <h1 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                WaveAdmin
              </h1>
              <p className={`text-xs font-semibold ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                Forecast Hub
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className={`lg:hidden p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
          </button>
        </div>

        <nav className="p-4 space-y-2 mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-semibold transition-all duration-300 relative group ${
                  isActive
                    ? darkMode
                      ? 'bg-gradient-to-r from-blue-600/80 to-cyan-600/80 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700'
                    : darkMode
                    ? 'text-gray-300 hover:bg-gray-700/40'
                    : 'text-gray-700 hover:bg-gray-100/50'
                }`}
              >
                {isActive && (
                  <div className={`absolute inset-0 rounded-xl ${
                    darkMode
                      ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20'
                      : 'bg-gradient-to-r from-blue-400/10 to-cyan-400/10'
                  } animate-pulse`}></div>
                )}
                <Icon size={20} className={isActive ? '' : 'group-hover:scale-110 transition-transform'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className={`absolute bottom-0 left-0 right-0 p-6 border-t ${
          darkMode
            ? 'border-gray-700/30 bg-gradient-to-t from-gray-900 to-transparent'
            : 'border-gray-200/30 bg-gradient-to-t from-white to-transparent'
        }`}>
          <div className={`rounded-xl p-4 backdrop-blur-sm border ${
            darkMode 
              ? 'bg-gray-700/30 border-gray-600/30' 
              : 'bg-blue-50/50 border-blue-200/30'
          }`}>
            <p className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Admin Account
            </p>
            <p className={`font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              System Admin
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

// Enhanced Header
const Header = ({ activeTab, onMobileMenuToggle, darkMode, toggleDarkMode }) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const AUTH_API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/auth`;
  const checkRoute = `${AUTH_API_BASE_URL}/check`;

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const checkResponse = await fetch(checkRoute, {
          method: 'GET',
          credentials: 'include',
        });

        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          const userId = checkData.user.id;
          const userDetailsResponse = await fetchUserDetails(userId);
          setCurrentUser(userDetailsResponse);
        } else {
          console.error('Failed to authenticate user');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const getPageTitle = () => {
    const titles = {
      dashboard: 'Dashboard Overview',
      charts: 'Wave Charts Review',
      forecasters: 'Forecaster Management',
      analytics: 'Analytics & Reports',
      settings: 'Settings & Configuration'
    };
    return titles[activeTab] || 'Dashboard';
  };

  const getPageDescription = () => {
    const descriptions = {
      dashboard: 'Monitor submissions and approve forecasts',
      charts: 'Review and approve submitted wave forecast charts',
      forecasters: 'Manage forecaster accounts and permissions',
      analytics: 'View detailed analytics and performance metrics',
      settings: 'Configure system settings and preferences'
    };
    return descriptions[activeTab] || 'Welcome back!';
  };

  const handleLogout = async () => {
    await logoutUser();
    setShowUserDropdown(false);
  };

  const userInitials = currentUser
    ? getUserInitials(currentUser.firstName, currentUser.lastName, currentUser.username)
    : 'U';
  const userName = currentUser
    ? getFullName(currentUser.firstName, currentUser.lastName, currentUser.username)
    : 'Loading...';
  const userRole = currentUser ? (currentUser.role === 'admin' ? 'Administrator' : 'User') : 'Loading...';
  const userEmail = currentUser ? currentUser.email : 'Loading...';

  return (
    <header className={`border-b sticky top-0 z-20 backdrop-blur-xl ${
      darkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'
    }`}>
      <div className="px-6 py-5 flex items-center justify-between">
        <div className="flex-1">
          <button
            onClick={onMobileMenuToggle}
            className={`lg:hidden p-2 rounded-lg transition-all mb-3 ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <Menu size={24} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
          </button>
          <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {getPageTitle()}
          </h2>
          <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {getPageDescription()}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`p-3 rounded-xl transition-all transform hover:scale-110 ${
              darkMode
                ? 'bg-gray-700/50 text-yellow-400 hover:bg-gray-700'
                : 'bg-gray-100/80 text-amber-500 hover:bg-gray-200'
            }`}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 ${
                darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100/80'
              }`}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg hover:shadow-blue-500/50 transition-shadow">
                <span className="text-white font-bold text-sm">{userInitials}</span>
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {userName}
                </p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {userRole}
                </p>
              </div>
              <ChevronDown
                size={16}
                className={`hidden sm:block transition-transform duration-300 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                } ${showUserDropdown ? 'rotate-180' : ''}`}
              />
            </button>

            {/* User Dropdown Menu */}
            {showUserDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserDropdown(false)}
                />
                <div className={`absolute right-0 mt-3 w-64 rounded-2xl shadow-2xl border backdrop-blur-xl z-20 overflow-hidden transition-all duration-200 ${
                  darkMode
                    ? 'bg-gray-800/80 border-gray-700/50'
                    : 'bg-white/80 border-gray-200/50'
                }`}>
                  {/* User Info Header */}
                  <div className={`px-6 py-5 border-b ${darkMode ? 'border-gray-700/30' : 'border-gray-200/30'} bg-gradient-to-r from-blue-500/10 to-cyan-500/10`}>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-lg">{userInitials}</span>
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {userName}
                        </p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {userEmail}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className={`py-2 ${darkMode ? 'bg-gray-800/50' : 'bg-white/50'}`}>
                    <button className={`w-full px-6 py-3 flex items-center gap-3 text-sm font-semibold transition-all duration-200 hover:translate-x-1 ${
                      darkMode
                        ? 'text-gray-300 hover:bg-gray-700/50 hover:text-blue-400'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                    }`}>
                      <User size={18} />
                      <span>Profile Settings</span>
                    </button>
                    <button className={`w-full px-6 py-3 flex items-center gap-3 text-sm font-semibold transition-all duration-200 hover:translate-x-1 ${
                      darkMode
                        ? 'text-gray-300 hover:bg-gray-700/50 hover:text-blue-400'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                    }`}>
                      <Settings size={18} />
                      <span>Preferences</span>
                    </button>
                  </div>

                  {/* Logout Button */}
                  <div className={`border-t ${darkMode ? 'border-gray-700/30' : 'border-gray-200/30'} py-2`}>
                    <button
                      onClick={handleLogout}
                      className={`w-full px-6 py-3 flex items-center gap-3 text-sm font-bold transition-all duration-200 hover:translate-x-1 ${
                        darkMode
                          ? 'text-red-400 hover:bg-red-900/20'
                          : 'text-red-600 hover:bg-red-50'
                      }`}
                    >
                      <LogOut size={18} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent darkMode={darkMode} />;
      case 'charts':
        return <ChartReviewPage darkMode={darkMode} />;
      case 'forecasters':
        return <ForecasterManagement darkMode={darkMode} />;
      case 'analytics':
        return <AnalyticsPage darkMode={darkMode} />;
      case 'settings':
        return <SettingsPage darkMode={darkMode} />;
      default:
        return <DashboardContent darkMode={darkMode} />;
    }
  };

  return (
    <div className={`min-h-screen flex transition-colors duration-500 ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        darkMode={darkMode}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <Header
          activeTab={activeTab}
          onMobileMenuToggle={() => setIsMobileOpen(!isMobileOpen)}
          darkMode={darkMode}
          toggleDarkMode={() => setDarkMode(!darkMode)}
        />

        <main className="flex-1 p-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;