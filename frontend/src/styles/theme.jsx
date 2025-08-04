import lightBg from '../assets/bg_light.png';
import darkBg from '../assets/bg_dark.png';

const sharedColors = {
  blue: '#01b0ef',
  lightBlue: '#01a0da',
  white: '#ffffff',
  black: '#000000',
};

const sharedFonts = {
  thin: '"Poppins-Thin", Helvetica, sans-serif',
  light: '"Poppins-Light", Helvetica, sans-serif',
  regular: '"Poppins-Regular", Helvetica, sans-serif',
  medium: '"Poppins-Medium", Helvetica, sans-serif',
  bold: '"Poppins-Bold", Helvetica, sans-serif',
  black: '"Poppins-Black", Helvetica, sans-serif',
  italic: '"Poppins-Italic", Helvetica, sans-serif',
  mediumItalic: '"Poppins-MediumItalic", Helvetica, sans-serif',
  boldItalic: '"Poppins-BoldItalic", Helvetica, sans-serif',
};

const sharedFontSizes = {
  xsmall: '12px',
  small: '14px',
  medium: '16px',
  large: '18px',
  xlarge: '20px',
  xxlarge: '24px',
  heading: '64px',
};

const sharedFontWeights = {
  thin: 100,
  light: 300,
  regular: 400,
  medium: 500,
  bold: 700,
  black: 900,
};

const sharedSpacing = {
  xsmall: '8px',
  small: '10px',
  medium: '20px',
  large: '30px',
  headerHeight: '70px',
  freeSpaceHeight: '300px',
  freeSpaceMarginTop: '200px',
};

const sharedBlur = {
  regular: '12px',
  mobile: '8px',
};

const sharedZIndex = {
  stickyHeader: 999,
  loadingScreen: 9999,
};

const sharedAnimations = {
  spin: 'spin 1s linear infinite',
};

const sharedBorderRadius = {
  xxsmall: '2px',
  xsmall: '4px',
  small: '6px',
  medium: '8px',
  large: '10px',
  xlarge: '12px',
};

export const theme = {
  backgroundImage: lightBg,

  colors: {
    highlight: '#01b0ef',
    background: '#ebebeb',
    lightBackground: '#f3f3f3',
    darkBackground: '#121212',
    textBackground: 'rgba(255, 255, 255, 0.7)',

    textPrimary: '#000',
    mobileTextPrimary: '#000',
    textSecondary: '#b5b5b5',

    toggleBackground: '#fff',
    toggleBorder: '#000',
    toggle: '#fccc52',

    bgHeader: '#fff',

    mapStyles: {
      light: 'mapbox://styles/kaloy0324/cma61lu5s006f01sid8kbhbci',
      dark: 'mapbox://styles/mapbox/dark-v11',
    },

    featureTitle: '#000',
    featureSubtitle: '#b5b5b5',

    linksTitle: '#000',
    links: '#666',

    glassBackground: 'rgba(255, 255, 255, 0.12)',
    glassBorder: 'rgba(255, 255, 255, 0.2)',
    glassBackgroundMobile: 'rgba(255, 255, 255, 0.1)',
    glassBorderMobile: 'rgba(255, 255, 255, 0.15)',

    boxShadow: '0px 4px 30px rgba(0, 0, 0, 0.1)',
    boxShadowHover: '0px 8px 40px rgba(0, 0, 0, 0.15)',

    loadingBackground: 'rgba(0, 0, 0, 0.5)',
    loadingText: '#fff',
    loadingSpinnerBorder: '#f3f3f3',
    loadingSpinnerBorderTop: '#3498db',
  },
  
  mainColors: sharedColors,
  fonts: sharedFonts,
  fontSizes: sharedFontSizes,
  fontWeights: sharedFontWeights,
  spacing: sharedSpacing,
  blur: sharedBlur,
  borderRadius: sharedBorderRadius,

  gradients: {
    background: '#ffffff',
    backgroundMobile: '#f3f3f3',
    stickyHeader: '#ffffff',
  },

  zIndex: sharedZIndex,
  animations: sharedAnimations,
};

export const darkTheme = {
  backgroundImage: darkBg,

  colors: {
    highlight: '#01b0ef',
    background: '#121212',
    lightBackground: '#2c3e50',
    darkBackground: '#1c1c1c',
    textBackground: 'rgba(0, 0, 0, 0.7)',

    textPrimary: '#ffffff',
    mobileTextPrimary: '#ffffff',
    textSecondary: '#979797',

    toggleBackground: '#000',
    toggleBorder: '#fff',
    toggle: '#609fca',

    bgHeader: '#2d3e4f',
    backdropFilter: 'blur(8px)',
    '-webkit-backdrop-filter': 'blur(8px)',

    featureTitle: '#fff',
    featureSubtitle: '#fff',

    linksTitle: '#fff',
    links: '#fff',

    glassBackground: 'rgba(0, 0, 0, 0.12)',
    glassBorder: 'rgba(0, 0, 0, 0.2)',
    glassBackgroundMobile: 'rgba(0, 0, 0, 0.1)',
    glassBorderMobile: 'rgba(0, 0, 0, 0.15)',

    boxShadow: '0px 4px 30px rgba(255, 255, 255, 0.1)',
    boxShadowHover: '0px 8px 40px rgba(255, 255, 255, 0.15)',

    loadingBackground: 'rgba(0, 0, 0, 0.8)',
    loadingText: '#fff',
    loadingSpinnerBorder: '#333',
    loadingSpinnerBorderTop: '#3498db',
  },

  mainColors: sharedColors,
  fonts: sharedFonts,
  fontSizes: sharedFontSizes,
  fontWeights: sharedFontWeights,
  spacing: sharedSpacing,
  blur: sharedBlur,
  borderRadius: sharedBorderRadius,

  gradients: {
    background: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
    stickyHeader: 'linear-gradient(to right, rgba(13, 13, 13, 0.7), rgba(33, 33, 33, 0.8))',
  },

  zIndex: sharedZIndex,
  animations: sharedAnimations,
};
