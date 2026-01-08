//  ╔═══════════════════════════════════════════════════════════════════════╗
//  ║                        🌪 Component B Project 1                       ║
//  ╠═══════════════════════════════════════════════════════════════════════╣
//  ║  📁 Project       : DOST-MECO-TECO-VOTE III Component-B               ║
//  ║  📝 Description   : Weather forecasting platform                      ║
//  ║  👨‍💻 Author        : Karl Santiago Bernaldez                           ║
//  ║  📅 Created       : 2025-03-24                                        ║
//  ║  🕓 Last Updated  : 2026-01-06                                        ║
//  ║  🧭 Version       : v2.0.1                                            ║
//  ╚═══════════════════════════════════════════════════════════════════════╝

import React from "react";
import { PagasaLogo } from "./Logo";
import Facebook from "@/assets/Facebook.svg";
import Instagram from "@/assets/Instagram.png";
import Linkedin from "@/assets/Linkedin.png";
import Twitter from "@/assets/Twitter.svg";
import line1 from "@/assets/line1.png";

// Constants for better maintainability
const SOCIAL_LINKS = [
  {
    href: "https://www.facebook.com/PAGASA.DOST.GOV.PH",
    icon: Facebook,
    alt: "Facebook",
  },
  {
    href: "https://x.com/dost_pagasa",
    icon: Twitter,
    alt: "Twitter",
  },
  {
    href: "https://www.instagram.com/pagasa_dost/",
    icon: Instagram,
    alt: "Instagram",
  },
  {
    href: "https://www.linkedin.com/company/dost-pagasa",
    icon: Linkedin,
    alt: "LinkedIn",
  },
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

const GOV_LINKS = [
  { href: "https://data.gov.ph", label: "Open Data Portal" },
  { href: "https://www.officialgazette.gov.ph", label: "Official Gazette" },
];

const PAGE_LINKS = [
  { href: "https://www.panahon.gov.ph/", label: "Hydro-Met", external: true },
  { href: "https://hazardhunter.georisk.gov.ph/map", label: "Hazard Map", external: true },
  { href: "/", label: "Wave" },
  { href: "/services", label: "Services" },
  { href: "/blog", label: "Blog" },
];

// Reusable Components
const ExternalLink = ({ href, children, className = "" }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={className}
  >
    {children}
  </a>
);

const SocialIcon = ({ href, icon, alt }) => (
  <ExternalLink
    href={href}
    className="transition-opacity hover:opacity-70"
  >
    <img src={icon} alt={alt} className="w-6 h-6" />
  </ExternalLink>
);

const LinkSection = ({ title, links, titleClassName = "", isDarkMode }) => (
  <div className="flex flex-col gap-3 min-w-[150px] md:text-left text-center">
    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} ${titleClassName}`}>
      {title}
    </h3>
    <nav className="flex flex-col gap-2">
      {links.map(({ href, label, external }) => {
        const linkClasses = `text-base font-light ${isDarkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'} hover:underline transition-colors`;
        
        return external ? (
          <ExternalLink key={label} href={href} className={linkClasses}>
            {label}
          </ExternalLink>
        ) : (
          <a key={label} href={href} className={linkClasses}>
            {label}
          </a>
        );
      })}
    </nav>
  </div>
);

const Footer = ({ isDarkMode = false }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} w-full px-4 py-8 box-border`}>
      <div className="max-w-[1200px] mx-auto">
        {/* Main Content */}
        <div className="flex flex-wrap justify-between gap-8 lg:flex-row flex-col lg:items-start items-center">
          {/* Social Section */}
          <section className="flex-1 min-w-[250px] flex flex-col gap-4 lg:text-left text-center lg:items-start items-center">
            {/* Logo */}
            <ExternalLink
              href="https://www.pagasa.dost.gov.ph/"
              className="no-underline"
            >
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <PagasaLogo />
                <span className={`text-[1.8rem] font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  PAGASA
                </span>
              </div>
            </ExternalLink>

            {/* Description */}
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} max-w-[400px] leading-relaxed`}>
              Welcome to PAGASA, we are the nation's trusted source for accurate
              weather forecasts, climate information, and astronomical services
              dedicated to safeguarding lives, livelihoods, and the future of our
              communities.
            </p>

            {/* Social Icons */}
            <div className="flex gap-4 justify-center lg:justify-start -mt-2 lg:mt-0">
              {SOCIAL_LINKS.map((social) => (
                <SocialIcon key={social.alt} {...social} />
              ))}
            </div>
          </section>

          {/* Links Section */}
          <nav className="flex flex-wrap gap-8 justify-between flex-[2] min-w-[250px] lg:flex-row flex-col lg:gap-8 gap-6 lg:items-start items-center lg:mt-0 -mt-12">
            <LinkSection
              title="Government Links"
              links={GOVERNMENT_LINKS}
              isDarkMode={isDarkMode}
            />
            <LinkSection
              title="GOV.PH"
              links={GOV_LINKS}
              isDarkMode={isDarkMode}
            />
            <LinkSection
              title="Pages"
              links={PAGE_LINKS}
              titleClassName="font-bold"
              isDarkMode={isDarkMode}
            />
          </nav>
        </div>

        {/* Separator */}
        <img
          src={line1}
          alt=""
          className={`w-full h-px my-8 object-cover lg:mb-8 mb-4 ${isDarkMode ? 'opacity-20' : 'opacity-30'}`}
          aria-hidden="true"
        />

        {/* Copyright */}
        <div className="flex items-center justify-center gap-2 flex-wrap text-center">
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            © {currentYear} Philippine Atmospheric, Geophysical and Astronomical
            Services Administration (PAGASA). All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;