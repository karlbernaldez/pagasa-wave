//  ╔═══════════════════════════════════════════════════════════════════════╗
//  ║                        🌪 Component B Project 1                       ║
//  ╠═══════════════════════════════════════════════════════════════════════╣
//  ║  📁 Project       : DOST-MECO-TECO-VOTE III Component-B               ║
//  ║  📝 Description   : Weather forecasting platform                      ║
//  ║  👨‍💻 Author        : Karl Santiago Bernaldez                           ║
//  ║  📅 Created       : 2025-03-24                                        ║
//  ║  🕓 Last Updated  : 2025-05-29                                        ║
//  ║  🧭 Version       : v1.0.0                                            ║
//  ╚═══════════════════════════════════════════════════════════════════════╝

import React, { useEffect } from 'react';
import HeroSection from '@dashboards/public/components/home/HeroSection';
import Alerts from '@dashboards/public/components/home/Alerts';
import Services from '@dashboards/public/components/home/Services';
import HowItWorksSection from '@dashboards/public/components/home/HowItWorks';
import Partners from '@dashboards/public/components/home/Partners';
import Sources from '@dashboards/public/components/home/Sources';
import { useTheme } from '@/app/providers/ThemeProvider';

const Home = () => {
  const { isDarkMode } = useTheme();

  useEffect(() => {
    document.title = "WaveLab";
  }, []);

  return (
    <div>
      <HeroSection isDark={isDarkMode} />
      {/* <Alerts isDark={isDarkMode} /> */}
      <Services isDark={isDarkMode} />
      <Partners isDark={isDarkMode} />
      {/* <HowItWorksSection isDark={isDarkMode} />
      <Sources isDark={isDarkMode} /> */}
    </div>
  );
};

export default Home;