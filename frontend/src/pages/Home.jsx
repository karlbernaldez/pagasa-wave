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
import Feature from '@/components/pages/home/Feature';

const Home = ({ isDarkMode }) => {

  useEffect(() => {
    document.title = "WaveLab";
  }, []);

  return (
    <div>
      <HeroSection isDark={isDarkMode} />
      <Feature isDark={isDarkMode} />
    </div>
  );
};

export default Home;
