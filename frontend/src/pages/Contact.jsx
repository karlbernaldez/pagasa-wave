import React from 'react';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle, Globe } from 'lucide-react';

const contactCards = [
  {
    title: 'Email the team',
    description: 'Get in touch with our analysts for tailored guidance.',
    value: 'support@wavelab.ph',
    icon: Mail,
  },
  {
    title: 'Call our hotline',
    description: 'We are available 24/7 for urgent coastal advisories.',
    value: '+63 (02) 8123-4567',
    icon: Phone,
  },
  {
    title: 'Visit WaveLab HQ',
    description: 'Science Garden Complex, Quezon City, PH',
    value: 'Mon-Fri · 8:00 AM - 6:00 PM',
    icon: MapPin,
  },
];

const assistanceItems = [
  {
    title: 'Data Partnerships',
    description: 'Collaborate on data-sharing initiatives for coastal monitoring.',
  },
  {
    title: 'Operational Support',
    description: '24/7 alert routing for LGUs, port authorities, and disaster teams.',
  },
  {
    title: 'Training & Workshops',
    description: 'Hands-on sessions for interpreting wave intelligence dashboards.',
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
    name: 'KARL SANTIAGO B. BERNALDEZ',
    role: 'Technical Specialist',
    email: 'bernaldezkarlsantiago@gmail.com',
    phone: '+63 917 700 3144',
    avatar: 'https://lh3.googleusercontent.com/a/ACg8ocJ7wuDxl85cVks_J9i7isy6SBEMNMdojYuOkDkWW1nN9SJB7ng=s240-p-k-rw-no',
  },
];

const Contact = ({ isDarkMode }) => {
  return (
    <div
      className={`min-h-screen pt-28 pb-20 px-4 md:px-6 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
        }`}
    >
      <style>
        {`
          @keyframes wavelab-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}
      </style>
      <div className="max-w-6xl mx-auto flex flex-col gap-16">
        <section className="relative overflow-hidden rounded-3xl border border-transparent bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-10 md:p-14 text-white shadow-2xl">
          <div className="absolute -top-20 -right-32 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-1/3 translate-y-1/3 rounded-full bg-white/10 blur-3xl" />
          <div className="relative z-10 grid gap-6 md:grid-cols-[1.4fr_1fr] items-center">
            <div className="flex flex-col gap-6">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em]">
                <Globe className="h-4 w-4" />
                Contact WaveLab
              </span>
              <h1 className="text-3xl md:text-5xl font-bold leading-tight">
                Let&apos;s build a safer coastline together.
              </h1>
              <p className="text-base md:text-lg text-white/90 leading-relaxed">
                WaveLab combines coastal intelligence, forecasting, and decision support.
                Share your needs with us and we&apos;ll route you to the right PAGASA team.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <MessageCircle className="h-4 w-4" />
                  Start a Conversation
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-white/60 px-6 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10"
                >
                  <Send className="h-4 w-4" />
                  Submit a Request
                </button>
              </div>
            </div>
            <div className="rounded-2xl bg-white/15 p-6 backdrop-blur-md shadow-xl">
              <h2 className="text-lg font-semibold mb-2">Response targets</h2>
              <p className="text-sm text-white/90 mb-6">
                We prioritize urgent coastal advisories. Expect a response within the
                following timeframes.
              </p>
              <div className="grid gap-4 text-sm">
                <div className="flex items-center justify-between border-b border-white/20 pb-3">
                  <span>Critical incidents</span>
                  <span className="font-semibold">Under 1 hour</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/20 pb-3">
                  <span>Operational requests</span>
                  <span className="font-semibold">Within 6 hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>General inquiries</span>
                  <span className="font-semibold">1-2 business days</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {contactCards.map(({ title, description, value, icon: Icon }) => (
            <div
              key={title}
              className={`rounded-2xl border p-6 shadow-lg transition hover:-translate-y-1 ${isDarkMode
                  ? 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                  : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full ${isDarkMode ? 'bg-slate-800 text-sky-400' : 'bg-sky-50 text-sky-600'
                    }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
              </div>
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {description}
              </p>
              <p className="text-sm font-semibold">{value}</p>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl md:text-3xl font-semibold">Meet the WaveLab team</h2>
            <p className={`text-sm md:text-base ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Reach the right specialist quickly. Our coastal intelligence team is ready to help with
              forecasts, partnerships, and operational requests.
            </p>
          </div>
          <div
            className={`overflow-hidden rounded-3xl border p-6 shadow-xl ${isDarkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white'
              }`}
          >
            <div className="flex items-center justify-between mb-2">

            </div>
            <div className="relative">
              <div
                className={`pointer-events-none absolute left-0 top-0 h-full w-16 bg-gradient-to-r ${isDarkMode ? 'from-slate-950/60' : 'from-white'
                  } to-transparent`}
              />
              <div
                className={`pointer-events-none absolute right-0 top-0 h-full w-16 bg-gradient-to-l ${isDarkMode ? 'from-slate-950/60' : 'from-white'
                  } to-transparent`}
              />
              <div className="overflow-hidden">
                <div
                  className="flex w-max gap-4"
                  style={{
                    animation: 'wavelab-scroll 28s linear infinite',
                  }}
                >
                  {[...teamMembers, ...teamMembers].map((member, index) => (
                    <div
                      key={`${member.name}-${index}`}
                      className={`min-w-[260px] rounded-2xl border p-4 shadow-md ${isDarkMode
                          ? 'border-slate-800 bg-slate-950/80'
                          : 'border-slate-200 bg-slate-50'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={member.avatar}
                            alt={`${member.name} profile`}
                            className="h-11 w-11 rounded-full object-cover"
                            loading="lazy"
                          />
                          <div>
                            <p className="text-base font-semibold">{member.name}</p>
                            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                              {member.role}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full ${isDarkMode ? 'bg-slate-800 text-sky-400' : 'bg-white text-sky-600'
                            }`}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-sky-500" />
                          <span className="truncate">{member.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-sky-500" />
                          <span>{member.phone}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div
            className={`rounded-3xl border p-8 shadow-xl ${isDarkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white'
              }`}
          >
            <div className="flex items-center gap-3 mb-6">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${isDarkMode ? 'bg-slate-800 text-sky-400' : 'bg-sky-100 text-sky-600'
                  }`}
              >
                <Send className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Send a request</h2>
                <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  Tell us about your location, urgency, and the wave products you need.
                </p>
              </div>
            </div>
            <form className="grid gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Full name
                  <input
                    type="text"
                    placeholder="Juan dela Cruz"
                    className={`rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-sky-400 ${isDarkMode
                        ? 'border-slate-700 bg-slate-950 text-slate-100'
                        : 'border-slate-200 bg-white text-slate-900'
                      }`}
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Organization
                  <input
                    type="text"
                    placeholder="PAGASA Coastal Desk"
                    className={`rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-sky-400 ${isDarkMode
                        ? 'border-slate-700 bg-slate-950 text-slate-100'
                        : 'border-slate-200 bg-white text-slate-900'
                      }`}
                  />
                </label>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Email address
                  <input
                    type="email"
                    placeholder="name@email.com"
                    className={`rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-sky-400 ${isDarkMode
                        ? 'border-slate-700 bg-slate-950 text-slate-100'
                        : 'border-slate-200 bg-white text-slate-900'
                      }`}
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Contact number
                  <input
                    type="tel"
                    placeholder="+63 9XX XXX XXXX"
                    className={`rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-sky-400 ${isDarkMode
                        ? 'border-slate-700 bg-slate-950 text-slate-100'
                        : 'border-slate-200 bg-white text-slate-900'
                      }`}
                  />
                </label>
              </div>
              <label className="flex flex-col gap-2 text-sm font-medium">
                How can we help?
                <textarea
                  rows="5"
                  placeholder="Share your coastal area, time sensitivity, and preferred response channel."
                  className={`rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-sky-400 ${isDarkMode
                      ? 'border-slate-700 bg-slate-950 text-slate-100'
                      : 'border-slate-200 bg-white text-slate-900'
                    }`}
                />
              </label>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                  Subscribe to WaveLab operational updates.
                </label>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <Send className="h-4 w-4" />
                  Send request
                </button>
              </div>
            </form>
          </div>

          <div className="flex flex-col gap-6">
            <div
              className={`rounded-3xl border p-6 shadow-lg ${isDarkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white'
                }`}
            >
              <h3 className="text-lg font-semibold mb-4">How we can assist</h3>
              <div className="flex flex-col gap-4">
                {assistanceItems.map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <div
                      className={`mt-1 h-2 w-2 rounded-full ${isDarkMode ? 'bg-sky-400' : 'bg-sky-500'
                        }`}
                    />
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className={`rounded-3xl border p-6 shadow-lg ${isDarkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white'
                }`}
            >
              <h3 className="text-lg font-semibold mb-4">Operations center</h3>
              <div className="flex flex-col gap-4 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-sky-500" />
                  <div>
                    <p className="font-semibold">WaveLab Forecast Hub</p>
                    <p className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
                      Agham Road, Diliman, Quezon City, Philippines
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 text-sky-500" />
                  <div>
                    <p className="font-semibold">Hours of operation</p>
                    <p className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
                      Monday to Friday · 08:00 AM - 06:00 PM (GMT+8)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-5 w-5 text-sky-500" />
                  <div>
                    <p className="font-semibold">Emergency line</p>
                    <p className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
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
