export const toggleSelection = (setSelected, key) => {
    setSelected({
      waveWind: false,
      wave: false,
      colorImpaired: false,
      [key]: true,
    });
  };
  