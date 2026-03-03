import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  XCircle,
  BarChart3,
  Server,
  Bell,
  HardDrive,
  Cpu,
  Globe,
  Zap,
} from "lucide-react";
import StatCard from "@dashboards/admin/components/StatCard";

const SYSTEM_ALERTS = [
  { title: "High wave advisory for Northern Luzon", level: "Critical", time: "10 mins ago" },
  { title: "Forecast model sync completed", level: "Info", time: "1 hour ago" },
  { title: "2 pending user requests require review", level: "Warning", time: "2 hours ago" },
];

const TEAM_LOAD = [
  { team: "Forecasters", active: 14, total: 18 },
  { team: "Analysts", active: 8, total: 10 },
  { team: "Admins", active: 3, total: 4 },
];

const ACTIVITY_FEED = [
  { text: "Wave Chart #298 approved", time: "8 mins ago" },
  { text: "New forecaster registered", time: "25 mins ago" },
  { text: "Marine advisory issued", time: "1 hour ago" },
  { text: "WW3 model updated", time: "2 hours ago" },
];

const RECENT_SUBMISSIONS = [
  { id: 301, author: "Forecaster A", status: "Pending" },
  { id: 300, author: "Forecaster B", status: "Approved" },
  { id: 299, author: "Forecaster C", status: "Approved" },
  { id: 298, author: "Forecaster D", status: "Rejected" },
];

const INFRA_METRICS = [
  { label: "CPU Usage", value: "42%", icon: Cpu },
  { label: "Storage", value: "68%", icon: HardDrive },
  { label: "API Latency", value: "120 ms", icon: Zap },
  { label: "Tile Server", value: "Online", icon: Globe },
];

const DashboardOverview = ({ isDarkMode }) => {
  const cardBg = isDarkMode
    ? "bg-gray-800/50 border-gray-700/40"
    : "bg-white/70 border-gray-200/60";

  const muted = isDarkMode ? "text-gray-400" : "text-gray-500";
  const text = isDarkMode ? "text-white" : "text-gray-900";

  return (
    <div className="space-y-10">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className={`text-sm font-semibold uppercase tracking-widest ${muted}`}>
            Operational Overview
          </p>
          <h1 className={`text-3xl md:text-4xl font-bold mt-2 ${text}`}>
            Wave Forecast Control Center
          </h1>
        </div>

        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
          isDarkMode
            ? "bg-green-900/30 text-green-300 border border-green-700/30"
            : "bg-green-100 text-green-700 border border-green-200"
        }`}>
          <Server size={16} />
          System Healthy • 99.8% uptime
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
        <StatCard title="Total Charts" value="284" change="+12%" icon={MapPin} color="blue" trend="up" isDarkMode={isDarkMode}/>
        <StatCard title="Users" value="56" change="+4 today" icon={Users} color="cyan" trend="up" isDarkMode={isDarkMode}/>
        <StatCard title="Alerts" value="7" change="2 critical" icon={Bell} color="amber" trend="up" isDarkMode={isDarkMode}/>
        <StatCard title="Pending" value="23" change="+5 new" icon={Clock} color="amber" trend="up" isDarkMode={isDarkMode}/>
        <StatCard title="Rejected" value="14" change="-3 resolved" icon={XCircle} color="red" trend="down" isDarkMode={isDarkMode}/>
        <StatCard title="Activity" value="86%" change="Stable" icon={BarChart3} color="green" trend="up" isDarkMode={isDarkMode}/>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Activity Timeline */}
        <div className={`xl:col-span-2 rounded-2xl p-6 border backdrop-blur-lg ${cardBg}`}>
          <div className="flex items-center gap-3 mb-6">
            <Activity className="text-cyan-500" size={20}/>
            <h3 className={`text-xl font-bold ${text}`}>Activity Timeline</h3>
          </div>

          <div className="space-y-5">
            {ACTIVITY_FEED.map((item, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-2 h-2 mt-2 rounded-full bg-cyan-500"/>
                <div>
                  <p className={`font-medium ${text}`}>{item.text}</p>
                  <p className={`text-xs mt-1 ${muted}`}>{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className={`rounded-2xl p-6 border backdrop-blur-lg ${cardBg}`}>
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="text-amber-500" size={20}/>
            <h3 className={`text-xl font-bold ${text}`}>System Alerts</h3>
          </div>

          <div className="space-y-4">
            {SYSTEM_ALERTS.map((alert) => (
              <div key={alert.title} className={`p-4 rounded-xl ${
                isDarkMode ? "bg-gray-700/30" : "bg-gray-100/60"
              }`}>
                <div className="flex justify-between items-center">
                  <p className={`font-semibold ${text}`}>{alert.title}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    alert.level === "Critical"
                      ? "bg-red-500/20 text-red-500"
                      : alert.level === "Warning"
                      ? "bg-amber-500/20 text-amber-500"
                      : "bg-cyan-500/20 text-cyan-500"
                  }`}>
                    {alert.level}
                  </span>
                </div>
                <p className={`text-xs mt-2 ${muted}`}>{alert.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RECENT SUBMISSIONS + INFRA */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Recent submissions */}
        <div className={`rounded-2xl p-6 border backdrop-blur-lg ${cardBg}`}>
          <h3 className={`text-xl font-bold mb-4 ${text}`}>Recent Submissions</h3>

          <div className="space-y-3">
            {RECENT_SUBMISSIONS.map((s) => (
              <div key={s.id} className={`p-4 rounded-xl flex justify-between ${
                isDarkMode ? "bg-gray-700/30" : "bg-gray-100/60"
              }`}>
                <p className={text}>Wave Chart #{s.id} • {s.author}</p>
                <span className={`text-xs px-3 py-1 rounded-lg ${
                  s.status === "Pending"
                    ? "bg-amber-500/20 text-amber-500"
                    : s.status === "Rejected"
                    ? "bg-red-500/20 text-red-500"
                    : "bg-emerald-500/20 text-emerald-500"
                }`}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Infrastructure */}
        <div className={`rounded-2xl p-6 border backdrop-blur-lg ${cardBg}`}>
          <h3 className={`text-xl font-bold mb-4 ${text}`}>System Metrics</h3>

          <div className="grid grid-cols-2 gap-4">
            {INFRA_METRICS.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} className={`p-4 rounded-xl ${
                  isDarkMode ? "bg-gray-700/30" : "bg-gray-100/60"
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={16}/>
                    <span className="text-sm opacity-70">{m.label}</span>
                  </div>
                  <p className="text-xl font-bold">{m.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* TEAM UTILIZATION */}
      <div className={`rounded-2xl p-6 border backdrop-blur-lg ${cardBg}`}>
        <h3 className={`text-xl font-bold mb-6 ${text}`}>Team Utilization</h3>

        <div className="grid md:grid-cols-3 gap-6">
          {TEAM_LOAD.map((item) => {
            const percent = Math.round((item.active / item.total) * 100);
            return (
              <div key={item.team}>
                <div className="flex justify-between text-sm mb-2">
                  <span>{item.team}</span>
                  <span>{percent}%</span>
                </div>

                <div className={`w-full h-3 rounded-full ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                }`}>
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <p className="text-xs mt-2 opacity-70">
                  {item.active}/{item.total} active
                </p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default DashboardOverview;
