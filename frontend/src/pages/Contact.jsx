import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle, Globe, CheckCircle2, Zap, Users, Shield } from 'lucide-react';

const Contact = ({ isDarkMode }) => {
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    email: '',
    phone: '',
    message: '',
    subscribe: false
  });

  const contactCards = [
    {
      title: 'Email the team',
      description: 'Get in touch with our analysts for tailored guidance.',
      value: 'support@wavelab.ph',
      icon: Mail,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Call our hotline',
      description: 'We are available 24/7 for urgent coastal advisories.',
      value: '+63 (02) 8123-4567',
      icon: Phone,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      title: 'Visit WaveLab HQ',
      description: 'Science Garden Complex, Quezon City, PH',
      value: 'Mon-Fri · 8:00 AM - 6:00 PM',
      icon: MapPin,
      color: 'from-purple-500 to-violet-500',
    },
  ];

  const assistanceItems = [
    {
      title: 'Data Partnerships',
      description: 'Collaborate on data-sharing initiatives for coastal monitoring.',
      icon: Globe,
    },
    {
      title: 'Operational Support',
      description: '24/7 alert routing for LGUs, port authorities, and disaster teams.',
      icon: Shield,
    },
    {
      title: 'Training & Workshops',
      description: 'Hands-on sessions for interpreting wave intelligence dashboards.',
      icon: Users,
    },
  ];

  const teamMembers = [
    {
      name: 'JEHAN FE S. PANTI',
      role: 'Weather Specialist / Component Lead',
      email: 'jehan.panti1295@gmail.com',
      phone: '+63 917 820 1432',
      avatar: 'https://lh3.googleusercontent.com/a-/ALV-UjVEQMbz24lpwXBYV4g6CLaF5wU8yB9RTi0DTHNfMSTYyWZ7Qvnq=s64-p-k-rw-no',
    },
    {
      name: 'JOHN MARK I. DOLENDO',
      role: 'Senior Weather Specialist',
      email: 'jmdolendo@pagasa.dost.gov.ph',
      phone: '+63 917 610 7789',
      avatar: 'https://media.licdn.com/dms/image/v2/C5103AQHgQ7pH57lFpg/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1580554934063?e=1771459200&v=beta&t=XVtfY0B6r2X3AUczvclBrIEJMK5Qt_lLdWAT4LOSx_8',
    },
    {
      name: 'DARWIN R. ALEJOS, JR',
      role: 'Senior Weather Specialist',
      email: 'darwinalejosjr@gmail.com',
      phone: '+63 917 540 2211',
      avatar: 'https://lh3.googleusercontent.com/a-/ALV-UjXLOxxVyjxfefcDBcDtkiAVaBDMN6IVA1gMPB73CEQ82bEWakdW=s240-p-k-rw-no',
    },
    {
      name: 'MONICO C. ALEJO',
      role: 'Weather Specialist',
      email: 'monico.alejo@pagasa.dost.gov.ph',
      phone: '+63 917 332 9801',
      avatar: 'https://media.licdn.com/dms/image/v2/C5603AQEytShtm4_t6Q/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1593326362472?e=1771459200&v=beta&t=HQCIphmNGF6A3Jt_aPjPQP3gXL_odeJQS76_dVycGoM',
    },
    {
      name: 'DANIEL JAMES E. VILLAMIL',
      role: 'Weather Specialist',
      email: 'katrina.dizon@wavelab.ph',
      phone: '+63 917 445 6670',
      avatar: 'https://lh3.googleusercontent.com/a-/ALV-UjUWxwwpxyhdaPKWkGBE0FR4iz09A9awTewGrJmtdWCmEvTZd-I=s240-p-k-rw-no',
    },
    {
      name: 'RIZZA LIZ ABANILLA',
      role: 'Admin Officer',
      email: 'izaabanilla8@gmail.com',
      phone: '+63 917 700 3144',
      avatar: 'https://lh3.googleusercontent.com/a-/ALV-UjVMrfZm9mN-ez8RlXZjNxsWzEVIfhLcWlWdEdRCrwR66mnbh1eftH7o5CEfrH_tdTci0Y3SwFf6D4MJdC2nnU6gKFJqc6KWmdYRKVtjSIU93YNahBznhFm47fTsfAOSwv1MToqlhuhO_qw1mBI4X3VKVSKnNznFyoR3eALx749_ZiilgmAYkV6hrVqInyvYU9PF-SlZg7g4CLnEGquQwbGxxPFA__t5_VrK90LsdMX7ir7CfdYQUQN4Y2BtdvTzlkWEpS0WD65eTTTh3ZXbeit3-A2SBfhDoplf1S1AXCB46Ng8ewaLTRsdgbgzSJ0U3GocHwY-2oFGVmgOZ1U_Gf42zy6Q_iY-bD7bL_qvuPj5rxivu9FxCHMwYCCJDHoKIG1sKbgDz8PsGjJczwizO3Tk5iukO2jBFhCg2xsrMxNN3LeDW7bRlsQDXcYwOXhnABmOydIcaSODSgKEM1lfbOugpYZbIlhTWJ3fCGukAPOa8Qydx4AF-NtF5jM-0KM2Nrh0b02zNwqzdGTSiar18735wGE9hHHS1wMOLjOtml0JqDoNiGIVP582VgBP2ZZrP5C4WSpQSr8amIPADjB2PlikWPAjH4hoMPxRI8OJ3z9CaFXFlXpSFB8o2xx3HBER-am44R3Q2ePRqQOVZL66jxADZci8TUCepJPLxTGJS0zwb30DiCQE67Jp3YMH_S9xmoUUdyabHXzV0khbGVEkITEhXtUVI53r-qQ_fBBwUMJT31Afcw9z2O771IBQsh78a6dG9NzfssJZuuRioF6eNKTXl1AdljihWw_rIzYd-VDGYlrmUiv1VhgypdhMuJLpqjHEadrXHTDyFZVS4jHTpFNay7zDO7aZcumf3IkwvT0zU4gBCKItq-OolOaD4_nMN5uQIaJx2qCihEhSJJYT4VGqy24a2NlTnsHKRojCE2Jbb7DBNwmxm7jMASFZoHBVZMSBxC_8YLDCHuAwoduI5dYlpTx4bdsC6eVvFTzsnuwT_87Yp2KMlUc88A5o6p7MxGbL_qZClhYWj6s9pBkpiguz9aoSdPCJiIVGJmyX4jwkWNhQ1nNn_SZehA=s240-p-k-rw-no',
    },
    {
      name: 'KARL SANTIAGO B. BERNALDEZ',
      role: 'Technical Specialist',
      email: 'bernaldezkarlsantiago@gmail.com',
      phone: '+63 917 700 3144',
      avatar: 'https://lh3.googleusercontent.com/a/ACg8ocJ7wuDxl85cVks_J9i7isy6SBEMNMdojYuOkDkWW1nN9SJB7ng=s240-p-k-rw-no',
    },
  ];

  const responseTargets = [
    { type: 'Critical incidents', time: 'Under 1 hour', icon: Zap },
    { type: 'Operational requests', time: 'Within 6 hours', icon: Clock },
    { type: 'General inquiries', time: '1-2 business days', icon: MessageCircle },
  ];

  return (
    <div
      className={`relative min-h-screen pt-28 pb-20 px-4 md:px-6 overflow-hidden transition-all duration-700 ${isDarkMode
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
          : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
        }`}
    >
      <style>
        {`
          @keyframes wavelab-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
        `}
      </style>

      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className={`absolute inset-0 transition-all duration-700 ${isDarkMode
              ? 'bg-[radial-gradient(circle_at_center,_theme(colors.blue.500)_1px,_transparent_1px)]'
              : 'bg-[radial-gradient(circle_at_center,_theme(colors.blue.400)_1px,_transparent_1px)]'
            } bg-[length:30px_30px]`}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-20">

        {/* Hero Section */}
        <section className="text-center mb-8">
          <div
            className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold mb-8 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${isDarkMode
                ? 'bg-blue-500/10 text-blue-300 border border-blue-400/20 hover:border-blue-400/40'
                : 'bg-blue-100/80 text-blue-700 border border-blue-200 hover:border-blue-300'
              }`}
          >
            <Globe className="animate-pulse" size={18} />
            Get in Touch with WaveLab
          </div>

          <h1
            className={`text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6 tracking-tight transition-colors duration-700 ${isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
          >
            Let&apos;s Build a{' '}
            <span
              className={`bg-gradient-to-r bg-clip-text text-transparent transition-all duration-700 ${isDarkMode
                  ? 'from-blue-400 via-cyan-400 to-emerald-400'
                  : 'from-blue-600 via-cyan-600 to-emerald-600'
                }`}
            >
              Safer Coastline
            </span>{' '}
            Together
          </h1>

          <p
            className={`text-lg sm:text-xl max-w-4xl mx-auto leading-relaxed transition-colors duration-700 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'
              }`}
          >
            WaveLab combines coastal intelligence, forecasting, and decision support. Share your needs
            with us and we&apos;ll route you to the right PAGASA team.
          </p>
        </section>

        {/* Contact Cards */}
        <section className="grid gap-6 md:grid-cols-3">
          {contactCards.map(({ title, description, value, icon: Icon, color }, index) => (
            <div
              key={title}
              className="group"
              style={{ animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both` }}
            >
              <div
                className={`relative h-full p-8 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-[1.02] overflow-hidden ${isDarkMode
                    ? 'bg-slate-900/70 border-slate-700/70 hover:bg-slate-900/90 hover:border-slate-600 hover:shadow-2xl'
                    : 'bg-white/90 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-2xl'
                  }`}
              >
                {/* Background Gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`}
                />

                {/* Shine Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                </div>

                <div className="relative">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 mb-5`}
                  >
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3
                    className={`text-xl font-bold mb-3 transition-colors duration-300 ${isDarkMode ? 'text-white group-hover:text-blue-300' : 'text-slate-900 group-hover:text-blue-700'
                      }`}
                  >
                    {title}
                  </h3>
                  <p className={`text-sm mb-4 leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {description}
                  </p>
                  <p className={`text-sm font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>{value}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Response Targets Banner */}
        <section
          className={`p-8 lg:p-10 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-[1.01] ${isDarkMode
              ? 'bg-gradient-to-br from-blue-900/20 to-cyan-900/10 border-blue-700/30'
              : 'bg-gradient-to-br from-blue-50/80 to-cyan-50/60 border-blue-200/50'
            }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center">
            <div className="lg:col-span-1">
              <h2
                className={`text-2xl lg:text-3xl font-black mb-2 tracking-tight transition-colors duration-700 ${isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}
              >
                Response Targets
              </h2>
              <p
                className={`text-sm transition-colors duration-700 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'
                  }`}
              >
                We prioritize urgent coastal advisories
              </p>
            </div>
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
              {responseTargets.map(({ type, time, icon: Icon }, index) => (
                <div
                  key={type}
                  className={`p-5 rounded-xl transition-all duration-300 hover:scale-[1.02] ${isDarkMode ? 'bg-slate-800/40 hover:bg-slate-800/60' : 'bg-white/70 hover:bg-white'
                    }`}
                >
                  <Icon
                    className={`h-8 w-8 mb-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      }`}
                  />
                  <div className={`text-sm mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {type}
                  </div>
                  <div
                    className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}
                  >
                    {time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="flex flex-col gap-6">
          <div className="text-center">
            <h2
              className={`text-3xl lg:text-4xl font-black mb-4 tracking-tight transition-colors duration-700 ${isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
            >
              Meet the{' '}
              <span
                className={`bg-gradient-to-r bg-clip-text text-transparent ${isDarkMode
                    ? 'from-blue-400 via-cyan-400 to-emerald-400'
                    : 'from-blue-600 via-cyan-600 to-emerald-600'
                  }`}
              >
                WaveLab Team
              </span>
            </h2>
            <p
              className={`text-base md:text-lg max-w-3xl mx-auto transition-colors duration-700 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'
                }`}
            >
              Our coastal intelligence team is ready to help with forecasts, partnerships, and operational requests.
            </p>
          </div>

          <div
            className={`overflow-hidden rounded-2xl border p-8 shadow-xl backdrop-blur-sm ${isDarkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/90'
              }`}
          >
            <div className="relative">
              <div
                className={`pointer-events-none absolute left-0 top-0 h-full w-20 bg-gradient-to-r ${isDarkMode ? 'from-slate-900/90 via-slate-900/60' : 'from-white/90 via-white/60'
                  } to-transparent z-10`}
              />
              <div
                className={`pointer-events-none absolute right-0 top-0 h-full w-20 bg-gradient-to-l ${isDarkMode ? 'from-slate-900/90 via-slate-900/60' : 'from-white/90 via-white/60'
                  } to-transparent z-10`}
              />
              <div className="overflow-hidden">
                <div
                  className="flex w-max gap-5"
                  style={{
                    animation: 'wavelab-scroll 35s linear infinite',
                  }}
                >
                  {[...teamMembers, ...teamMembers].map((member, index) => (
                    <div
                      key={`${member.name}-${index}`}
                      className={`group min-w-[280px] rounded-2xl border p-6 shadow-lg transition-all duration-300 hover:scale-[1.02] ${isDarkMode
                          ? 'border-slate-700 bg-slate-950/80 hover:bg-slate-950 hover:border-slate-600 hover:shadow-2xl'
                          : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 hover:shadow-2xl'
                        }`}
                    >
                      <div className="flex items-start gap-4 mb-5">
                        <img
                          src={member.avatar}
                          alt={`${member.name} profile`}
                          className="h-14 w-14 rounded-xl object-cover shadow-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                          loading="lazy"
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-base font-bold mb-1 transition-colors duration-300 ${isDarkMode ? 'text-white group-hover:text-blue-300' : 'text-slate-900 group-hover:text-blue-700'
                              }`}
                          >
                            {member.name}
                          </p>
                          <p
                            className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'
                              }`}
                          >
                            {member.role}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-cyan-500 flex-shrink-0" />
                          <span
                            className={`truncate ${isDarkMode ? 'text-slate-300' : 'text-slate-700'
                              }`}
                          >
                            {member.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-cyan-500 flex-shrink-0" />
                          <span
                            className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}
                          >
                            {member.phone}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form & Info Section */}
        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Contact Form */}
          <div
            className={`rounded-2xl border p-8 lg:p-10 shadow-xl backdrop-blur-sm ${isDarkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/90'
              }`}
          >
            <div className="flex items-center gap-4 mb-8">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg`}
              >
                <Send className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2
                  className={`text-2xl lg:text-3xl font-black transition-colors duration-700 ${isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                >
                  Send a Request
                </h2>
                <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  Tell us about your location, urgency, and the wave products you need.
                </p>
              </div>
            </div>

            <form className="grid gap-6">
              <div className="grid gap-6 md:grid-cols-2">
                <label className="flex flex-col gap-2.5 text-sm font-semibold">
                  <span className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>Full name</span>
                  <input
                    type="text"
                    placeholder="Juan dela Cruz"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`rounded-xl border px-4 py-3.5 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-cyan-400 ${isDarkMode
                        ? 'border-slate-700 bg-slate-950/60 text-slate-100 placeholder:text-slate-500'
                        : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'
                      }`}
                  />
                </label>
                <label className="flex flex-col gap-2.5 text-sm font-semibold">
                  <span className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>Organization</span>
                  <input
                    type="text"
                    placeholder="PAGASA Coastal Desk"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className={`rounded-xl border px-4 py-3.5 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-cyan-400 ${isDarkMode
                        ? 'border-slate-700 bg-slate-950/60 text-slate-100 placeholder:text-slate-500'
                        : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'
                      }`}
                  />
                </label>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <label className="flex flex-col gap-2.5 text-sm font-semibold">
                  <span className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>Email address</span>
                  <input
                    type="email"
                    placeholder="name@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`rounded-xl border px-4 py-3.5 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-cyan-400 ${isDarkMode
                        ? 'border-slate-700 bg-slate-950/60 text-slate-100 placeholder:text-slate-500'
                        : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'
                      }`}
                  />
                </label>
                <label className="flex flex-col gap-2.5 text-sm font-semibold">
                  <span className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>Contact number</span>
                  <input
                    type="tel"
                    placeholder="+63 9XX XXX XXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`rounded-xl border px-4 py-3.5 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-cyan-400 ${isDarkMode
                        ? 'border-slate-700 bg-slate-950/60 text-slate-100 placeholder:text-slate-500'
                        : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'
                      }`}
                  />
                </label>
              </div>

              <label className="flex flex-col gap-2.5 text-sm font-semibold">
                <span className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>How can we help?</span>
                <textarea
                  rows="5"
                  placeholder="Share your coastal area, time sensitivity, and preferred response channel."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className={`rounded-xl border px-4 py-3.5 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-cyan-400 resize-none ${isDarkMode
                      ? 'border-slate-700 bg-slate-950/60 text-slate-100 placeholder:text-slate-500'
                      : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'
                    }`}
                />
              </label>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <label className="flex items-center gap-3 text-sm cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.subscribe}
                    onChange={(e) => setFormData({ ...formData, subscribe: e.target.checked })}
                    className="h-5 w-5 rounded border-slate-300 text-cyan-600 focus:ring-2 focus:ring-cyan-400 cursor-pointer"
                  />
                  <span
                    className={`transition-colors duration-200 ${isDarkMode ? 'text-slate-300 group-hover:text-slate-200' : 'text-slate-600 group-hover:text-slate-700'
                      }`}
                  >
                    Subscribe to WaveLab operational updates
                  </span>
                </label>
                <button
                  type="button"
                  className="group inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                >
                  <Send className="h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-300" />
                  Send Request
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar Info */}
          <div className="flex flex-col gap-6">
            {/* Assistance Items */}
            <div
              className={`rounded-2xl border p-7 shadow-lg backdrop-blur-sm ${isDarkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/90'
                }`}
            >
              <h3
                className={`text-xl font-black mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}
              >
                How We Can Assist
              </h3>
              <div className="flex flex-col gap-5">
                {assistanceItems.map((item, index) => (
                  <div
                    key={item.title}
                    className={`group flex gap-4 p-4 rounded-xl transition-all duration-300 hover:scale-[1.02] ${isDarkMode ? 'bg-slate-800/40 hover:bg-slate-800/60' : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                  >
                    <div
                      className={`flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br ${index === 0 ? 'from-blue-500 to-cyan-500' :
                          index === 1 ? 'from-emerald-500 to-teal-500' :
                            'from-purple-500 to-violet-500'
                        } flex items-center justify-center shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}
                    >
                      <item.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p
                        className={`text-sm font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'
                          }`}
                      >
                        {item.title}
                      </p>
                      <p
                        className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'
                          }`}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Operations Center */}
            <div
              className={`rounded-2xl border p-7 shadow-lg backdrop-blur-sm ${isDarkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/90'
                }`}
            >
              <h3
                className={`text-xl font-black mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}
              >
                Operations Center
              </h3>
              <div className="flex flex-col gap-5 text-sm">
                <div className="flex items-start gap-4">
                  <MapPin className="mt-1 h-5 w-5 text-cyan-500 flex-shrink-0" />
                  <div>
                    <p
                      className={`font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'
                        }`}
                    >
                      WaveLab Forecast Hub
                    </p>
                    <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                      Agham Road, Diliman, Quezon City, Philippines
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Clock className="mt-1 h-5 w-5 text-cyan-500 flex-shrink-0" />
                  <div>
                    <p
                      className={`font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'
                        }`}
                    >
                      Hours of Operation
                    </p>
                    <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                      Monday to Friday · 08:00 AM - 06:00 PM (GMT+8)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Phone className="mt-1 h-5 w-5 text-cyan-500 flex-shrink-0" />
                  <div>
                    <p
                      className={`font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'
                        }`}
                    >
                      Emergency Line
                    </p>
                    <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                      +63 (02) 8123-9999
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Contact;