const SettingsSection = ({ isDarkMode }) => {
  const fields = [
    { label: 'Default Region', placeholder: 'Pacific Area of Responsibility' },
    { label: 'Alert Email', placeholder: 'alerts@pagasa.gov.ph' },
  ];

  return (
    <div className={`rounded-2xl border p-6 ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/80 border-gray-200'}`}>
      <h3 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>System Settings</h3>
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.label}>
            <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{field.label}</label>
            <input
              type="text"
              placeholder={field.placeholder}
              className={`w-full px-4 py-3 rounded-xl border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SettingsSection;