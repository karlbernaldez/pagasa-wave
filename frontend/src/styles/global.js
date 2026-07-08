import styled, { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body, #root {
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;

    /* Hide scrollbar */
    -ms-overflow-style: none;  /* IE & Edge */
    scrollbar-width: none;     /* Firefox */
  }

  html::-webkit-scrollbar,
  body::-webkit-scrollbar,
  #root::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }

  html {
    scroll-behavior: smooth;
    font-size: 16px;
  }

  body {
    font-family: 'Segoe UI', 'Roboto', 'Open Sans', sans-serif;
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
  }

  img {
    max-width: 100%;
    height: auto;
  }

  button {
    cursor: pointer;
    border: none;
    background: none;
  }

  a {
    text-decoration: none;
  }

  .wavelab-home {
    transition: background-color 360ms cubic-bezier(0.4, 0, 0.2, 1), color 360ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .wavelab-home > header.sticky,
  .wavelab-home .home-liquid,
  .wavelab-home .home-liquid::before,
  .wavelab-home .home-liquid-row,
  .wavelab-home .hero-ph-map::before,
  .wavelab-home .ph-map-shape,
  .wavelab-home .secondary-action,
  .wavelab-home .section-heading,
  .wavelab-home .muted-copy {
    transition-property: background-color, border-color, color, box-shadow, opacity, filter, -webkit-backdrop-filter, backdrop-filter;
    transition-duration: 360ms;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }

  .wavelab-home .hero-bg-layer {
    transition: opacity 420ms cubic-bezier(0.4, 0, 0.2, 1), filter 420ms cubic-bezier(0.4, 0, 0.2, 1);
    will-change: opacity;
  }

  .wavelab-home .hero-bottom-fade {
    background: transparent !important;
    overflow: hidden;
  }

  .wavelab-home .hero-bottom-fade::before,
  .wavelab-home .hero-bottom-fade::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    transition: opacity 420ms cubic-bezier(0.4, 0, 0.2, 1);
    will-change: opacity;
  }

  .wavelab-home .hero-bottom-fade::before {
    background: linear-gradient(180deg, rgba(248,250,252,0), rgba(248,250,252,0.92) 78%, rgba(248,250,252,1));
    opacity: 1;
  }

  .wavelab-home .hero-bottom-fade::after {
    background: linear-gradient(180deg, rgba(2,6,23,0), rgba(2,6,23,0.86) 78%, rgba(2,6,23,1));
    opacity: 0;
  }

  .wavelab-home.bg-slate-950 .hero-bottom-fade::before {
    opacity: 0;
  }

  .wavelab-home.bg-slate-950 .hero-bottom-fade::after {
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .wavelab-home,
    .wavelab-home > header.sticky,
    .wavelab-home .home-liquid,
    .wavelab-home .home-liquid::before,
    .wavelab-home .home-liquid-row,
    .wavelab-home .hero-bg-layer,
    .wavelab-home .hero-bottom-fade::before,
    .wavelab-home .hero-bottom-fade::after,
    .wavelab-home .hero-ph-map::before,
    .wavelab-home .ph-map-shape,
    .wavelab-home .secondary-action,
    .wavelab-home .section-heading,
    .wavelab-home .muted-copy {
      transition-duration: 1ms !important;
      animation-duration: 1ms !important;
      animation-iteration-count: 1 !important;
      scroll-behavior: auto !important;
    }
  }
`;

export const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: ${({ theme, $isDarkMode }) =>
    $isDarkMode ? theme.colors.darkBackground : theme.colors.lightBackground};
  transition: all 0.3s;

  /* Scroll handling */
  overflow-y: ${({ $noscroll }) => ($noscroll ? 'hidden' : 'auto')};
  overflow-x: hidden;

  /* Hide scrollbar but keep scroll functionality when enabled */
  -ms-overflow-style: none;  /* IE & Edge */
  scrollbar-width: none;     /* Firefox */

  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari */
  }
`;

export const MainContent = styled.main`
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  pointer-events: ${({ $isloading }) => ($isloading ? 'none' : 'auto')};
  opacity: ${({ $isloading }) => ($isloading ? 0.7 : 1)};
`;

export const FooterWrapper = styled.div`
  margin-top: auto;
  transition: all 0.3s;
`;

export const ErrorBoundaryFallback = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
  text-align: center;
  color: '#dc3545';

  h2 {
    margin-bottom: 1rem;
    font-size: 1.5rem;
  }

  p {
    margin-bottom: 1.5rem;
    opacity: 0.8;
  }

  button {
    padding: 0.75rem 1.5rem;
    background: white;
    color: white;
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    }
  }
`;