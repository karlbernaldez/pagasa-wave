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
import HeroSection from '@/components/pages/home/HeroSection';
import Alerts from '@/components/pages/home/Alerts';
import Services from '@/components/pages/home/Services';
import HowItWorksSection from '@/components/pages/home/HowItWorks';
import Partners from '@/components/pages/home/Partners';
import Sources from '@/components/pages/home/Sources';

const Home = ({ isDarkMode }) => {

  useEffect(() => {
    document.title = "WaveLab";
  }, []);

  return (
    <div>
      <HeroSection isDark={isDarkMode} />
      <Alerts isDark={isDarkMode} />
      <Services isDark={isDarkMode} />
      <Partners isDark={isDarkMode} />
      <HowItWorksSection isDark={isDarkMode} />
      <Sources isDark={isDarkMode} />
    </div>
  );
};

export default Home;