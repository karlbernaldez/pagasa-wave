//  ╔═══════════════════════════════════════════════════════════════════════╗
//  ║                        🌪 Component B Project 1                       ║
//  ╠═══════════════════════════════════════════════════════════════════════╣
//  ║  📁 Project       : DOST-MECO-TECO-VOTE III Component-B               ║
//  ║  📝 Description   : Weather forecasting platform                      ║
//  ║  👨‍💻 Author        : Karl Santiago Bernaldez                           ║
//  ║  📅 Created       : 2025-03-24                                        ║
//  ║  🕓 Last Updated  : 2026-02-03                                        ║
//  ║  🧭 Version       : v2.1.0                                            ║
//  ╚═══════════════════════════════════════════════════════════════════════╝

import React from "react";
import { PagasaLogo } from "./Logo";
import { ExternalLink, Mail, Phone, MapPin, ChevronRight } from "lucide-react";
import Facebook from "@/assets/Facebook.svg";
import Instagram from "@/assets/Instagram.png";
import Linkedin from "@/assets/Linkedin.png";
import Twitter from "@/assets/Twitter.svg";

// Constants for better maintainability
const SOCIAL_LINKS = [
  {
    href: "https://www.facebook.com/PAGASA.DOST.GOV.PH",
    icon: Facebook,
    alt: "Facebook",
    name: "Facebook"
  },
  {
    href: "https://x.com/dost_pagasa",
    icon: Twitter,
    alt: "Twitter",
    name: "Twitter"
  },
  {
    href: "https://www.instagram.com/pagasa_dost/",
    icon: Instagram,
    alt: "Instagram",
    name: "Instagram"
  },
  {
    href: "https://www.linkedin.com/company/dost-pagasa",
    icon: Linkedin,
    alt: "LinkedIn",
    name: "LinkedIn"
  },
];

const QUICK_LINKS = [
  { href: "/", label: "Wave Forecasts" },
  { href: "/services", label: "Services" },
  { href: "/blog", label: "News & Updates" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

const GOVERNMENT_LINKS = [
  { href: "https://president.gov.ph/", label: "Office of the President" },
  { href: "https://ovp.gov.ph", label: "Office of the Vice President" },
  { href: "https://senate.gov.ph", label: "Senate of the Philippines" },
  { href: "https://congress.gov.ph", label: "House of Representatives" },
  { href: "https://sc.judiciary.gov.ph", label: "Supreme Court" },
  { href: "https://ca.judiciary.gov.ph", label: "Court of Appeals" },
  { href: "https://sb.judiciary.gov.ph", label: "Sandiganbayan" },
];

const RESOURCES = [
  { href: "https://www.panahon.gov.ph/", label: "Hydro-Met Portal", external: true },
  { href: "https://hazardhunter.georisk.gov.ph/map", label: "Hazard Hunter Map", external: true },
  { href: "/api-docs", label: "API Documentation" },
  { href: "/research", label: "Research & Publications" },
];

const CONTACT_INFO = [
  {
    icon: Phone,
    text: "+63 (2) 8284-0800",
  },
  {
    icon: Mail,
    text: "info@pagasa.dost.gov.ph",
  },
];

// Reusable Components
const SocialIcon = ({ href, icon, alt, name, isDark }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={`p-2.5 rounded-lg transition-all duration-300 hover:scale-110 ${isDark
        ? 'bg-slate-800/50 hover:bg-slate-800'
        : 'bg-slate-50 hover:bg-slate-100'
      }`}
    aria-label={name}
  >
    <img src={icon} alt={alt} className="w-4 h-4" />
  </a>
);

const FooterLink = ({ href, label, external = false, isDark }) => {
  const linkClasses = `text-xs font-medium transition-colors duration-200 ${isDark
      ? 'text-slate-400 hover:text-blue-400'
      : 'text-slate-600 hover:text-blue-600'
    }`;

  const content = (
    <>
      {label}
      {external && <ExternalLink className="w-3 h-3 opacity-50 inline ml-1" />}
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={linkClasses}>
        {content}
      </a>
    );
  }

  return (
    <a href={href} className={linkClasses}>
      {content}
    </a>
  );
};

const LinkSection = ({ title, links, isDark }) => (
  <div className="flex flex-col gap-3">
    <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'
      }`}>
      {title}
    </h3>
    <nav className="flex flex-col gap-2">
      {links.map((link) => (
        <FooterLink key={link.label} {...link} isDark={isDark} />
      ))}
    </nav>
  </div>
);

const ContactItem = ({ icon: Icon, text, isDark }) => (
  <div className="flex items-start gap-2">
    <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-600'
      }`} />
    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'
      }`}>
      {text}
    </p>
  </div>
);

const Footer = ({ isDarkMode = false }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`relative overflow-hidden transition-all duration-700 ${isDarkMode
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
        : 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
      }`}>

      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className={`absolute inset-0 ${isDarkMode
            ? 'bg-[radial-gradient(circle_at_50%_50%,#3b82f6_1px,transparent_1px)]'
            : 'bg-[radial-gradient(circle_at_50%_50%,#60a5fa_1px,transparent_1px)]'
          } bg-[size:2rem_2rem]`} />
      </div>

      {/* Decorative Top Border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-8">

          {/* Brand Section - Spans 4 columns on desktop */}
          <div className="lg:col-span-4">
            <a
              href="https://www.pagasa.dost.gov.ph/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mb-4 group"
            >
              <div className="flex items-center gap-3">
                <div className="transition-transform duration-300 group-hover:scale-110">
                  <PagasaLogo />
                </div>
                <span className={`text-xl font-bold bg-gradient-to-r bg-clip-text text-transparent transition-all duration-300 ${isDarkMode
                    ? 'from-blue-400 to-cyan-400'
                    : 'from-blue-600 to-cyan-600'
                  }`}>
                  PAGASA
                </span>
              </div>
            </a>

            <p className={`text-sm leading-relaxed mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>
              PAGASA, an attached agency of the Department of Science and Technology (DOST), is mandated to provide protection against natural calamities and apply scientific knowledge to ensure public safety, economic security, and national development.
            </p>

            {/* Social Links */}
            <div className="flex gap-2">
              {SOCIAL_LINKS.map((social) => (
                <SocialIcon key={social.alt} {...social} isDark={isDarkMode} />
              ))}
            </div>
          </div>

          {/* Links Grid - Spans 5 columns on desktop */}
          <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 gap-6">

            {/* Quick Links */}
            <LinkSection
              title="Quick Links"
              links={QUICK_LINKS}
              isDark={isDarkMode}
            />

            {/* Resources */}
            <LinkSection
              title="Resources"
              links={RESOURCES}
              isDark={isDarkMode}
            />

            {/* Government Links */}
            <LinkSection
              title="Government"
              links={GOVERNMENT_LINKS.slice(0, 7)}
              isDark={isDarkMode}
            />
          </div>

          {/* Contact - Spans 3 columns on desktop */}
          <div className="lg:col-span-3">
            <h3 className={`text-base font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
              Contact Us
            </h3>
            <div className="space-y-3">
              {CONTACT_INFO.map((contact, index) => (
                <ContactItem key={index} {...contact} isDark={isDarkMode} />
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className={`h-px mb-6 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
          }`} />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">

          {/* Copyright */}
          <p
            className={`text-xs text-center md:text-left ${isDarkMode ? 'text-slate-500' : 'text-slate-600'
              }`}
          >
            © 1977 Philippine Atmospheric, Geophysical and Astronomical Services Administration (PAGASA).
            All rights reserved.{' '}
            <a
              href="https://www.dost.gov.ph/"
              target="_blank"
              rel="noopener noreferrer"
              className={`font-semibold transition-colors duration-200 ${isDarkMode
                  ? 'text-slate-400 hover:text-blue-400'
                  : 'text-slate-700 hover:text-blue-600'
                }`}
            >
              Department of Science and Technology
            </a>
          </p>

          {/* Legal Links */}
          <div className="flex items-center gap-4">
            <a
              href="/privacy"
              className={`text-xs font-medium transition-colors duration-200 ${isDarkMode
                  ? 'text-slate-500 hover:text-blue-400'
                  : 'text-slate-600 hover:text-blue-600'
                }`}
            >
              Privacy
            </a>
            <a
              href="/terms"
              className={`text-xs font-medium transition-colors duration-200 ${isDarkMode
                  ? 'text-slate-500 hover:text-blue-400'
                  : 'text-slate-600 hover:text-blue-600'
                }`}
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;