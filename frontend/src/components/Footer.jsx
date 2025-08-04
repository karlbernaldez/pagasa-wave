//  ╔═══════════════════════════════════════════════════════════════════════╗
//  ║                        🌪 Component B Project 1                       ║
//  ╠═══════════════════════════════════════════════════════════════════════╣
//  ║  📁 Project       : DOST-MECO-TECO-VOTE III Component-B               ║
//  ║  📝 Description   :  Weather forecasting platform                     ║
//  ║  👨‍💻 Author        : Karl Santiago Bernaldez                           ║
//  ║  📅 Created       : 2025-03-24                                        ║
//  ║  🕓 Last Updated  : 2025-05-29                                        ║
//  ║  🧭 Version       : v1.0.0                                            ║
//  ╚═══════════════════════════════════════════════════════════════════════╝

import React, { useContext } from "react";
import styled, { ThemeContext } from "styled-components";
import Copyright from "../assets/Copyright.svg";
import Facebook from "../assets/Facebook.svg";
import Instagram from "../assets/Instagram.png";
import Linkedin from "../assets/Linkedin.png";
import Twitter from "../assets/Twitter.svg";
import { PagasaLogo } from "./Logo";
import line1 from "../assets/line1.png";
import { theme, darkTheme } from '../styles/theme';

const FooterContainer = styled.footer`
  background-color: ${(props) => props.theme.colors.background};
  width: 100%;
  padding: 2rem 1rem;
  box-sizing: border-box;
`;

const FlexRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  gap: 2rem;

  @media (max-width: 820px) {
    flex-direction: column;
    align-items: center;
  }
`;

const SocialContainer = styled.div`
  flex: 1;
  min-width: 250px;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (max-width: 820px) {
    text-align: center;
    align-items: center;
  }
`;

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 11px;
  justify-content: center;

  @media (min-width: 821px) {
    justify-content: flex-start;
  }
`;

const PagasaWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const PagasaText = styled.div`
  color: ${(props) => props.theme.colors.highlight};
  font-family: ${(props) => props.theme.fonts.medium};
  font-size: 1.8rem;
  font-weight: 500;
`;

const TextWrapper = styled.p`
  color: ${(props) => props.theme.colors.links};
  font-family: ${(props) => props.theme.fonts.regular};
  font-size: 0.875rem;
  max-width: 400px;
`;

const IconContainer = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;

  @media (min-width: 821px) {
    justify-content: flex-start;
  }

  @media (max-width: 821px) {
    margin-top: -.5rem;
  }
`;

const LineImage = styled.img`
  width: 100%;
  height: 1px;
  margin: 2rem 0;
  object-fit: cover;

  @media (max-width: 821px) {
    margin-bottom: 1rem;
  }
`;

const RightsReservedContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
  text-align: center;
`;

const RightsText = styled.p`
  color: ${(props) => props.theme.colors.links};
  font-family: ${(props) => props.theme.fonts.balooMedium};
  font-size: 0.75rem;
`;

const LinksContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  justify-content: space-between;
  flex: 2;
  min-width: 250px;

  @media (max-width: 820px) {
    flex-direction: column;
    gap: 1.5rem;
    align-items: center;
    margin-top: -3rem;
  }
`;

const FrameTwo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 150px;
  text-align: left;

  @media (max-width: 820px) {
    text-align: center;
    min-width: 200px;
  }
`;

const FrameThree = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const StyledLink = styled.a`
  font-family: ${(props) => props.theme.fonts.light};
  font-size: 1rem;
  color: ${(props) => props.theme.colors.links};
  text-align: left;
  text-decoration: none;

  &:hover {
    color: ${(props) => props.theme.colors.highlight};
    text-decoration: underline;
  }

  @media (max-width: 820px) {
    text-align: center;
  }
`;

const FrameFour = styled(FrameTwo)``;

const LinksTitle = styled.div`
  font-family: ${(props) => props.theme.fonts.medium};
  font-size: 1.125rem;
  color: ${(props) => props.theme.colors.linksTitle};
  text-align: left;

  @media (max-width: 820px) {
    text-align: center;
  }
`;

const PagesTitle = styled.div`
  font-family: ${(props) => props.theme.fonts.balooBold};
  font-size: 1.125rem;
  color: ${(props) => props.theme.colors.linksTitle};
  text-align: left;

  @media (max-width: 820px) {
    text-align: center;
  }
`;

const Footer = () => {
  const { theme: currentTheme } = useContext(ThemeContext);  // Get the current theme

  return (
    <FooterContainer theme={currentTheme}>
      <FlexRow>
        <SocialContainer>
          <TextContainer>
            <a
              href="https://www.pagasa.dost.gov.ph/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <LogoContainer>
                <PagasaLogo />
                <PagasaWrapper>
                  <PagasaText theme={currentTheme}>PAGASA</PagasaText>
                </PagasaWrapper>
              </LogoContainer>
            </a>
            <TextWrapper theme={currentTheme}>
              Welcome to PAGASA, we are the nation's trusted source for accurate weather forecasts,
              climate information, and astronomical services dedicated to safeguarding lives,
              livelihoods, and the future of our communities.
            </TextWrapper>
            <IconContainer>
              <a href="https://www.facebook.com/PAGASA.DOST.GOV.PH" target="_blank" rel="noopener noreferrer">
                <img src={Facebook} alt="Facebook" />
              </a>
              <a href="https://x.com/dost_pagasa" target="_blank" rel="noopener noreferrer">
                <img src={Twitter} alt="Twitter" />
              </a>
              <a href="https://www.instagram.com/pagasa_dost/" target="_blank" rel="noopener noreferrer">
                <img src={Instagram} alt="Instagram" />
              </a>
              <a href="https://www.linkedin.com/company/dost-pagasa" target="_blank" rel="noopener noreferrer">
                <img src={Linkedin} alt="Linkedin" />
              </a>
            </IconContainer>
          </TextContainer>
        </SocialContainer>

        <LinksContainer>
          <FrameTwo>
            <LinksTitle theme={currentTheme}>Government Links</LinksTitle>
            <FrameThree>
              <StyledLink href="https://president.gov.ph/" target="_blank" rel="noopener noreferrer">Office of the President</StyledLink>
              <StyledLink href="https://ovp.gov.ph" target="_blank" rel="noopener noreferrer">Office of the Vice President</StyledLink>
              <StyledLink href="https://senate.gov.ph" target="_blank" rel="noopener noreferrer">Senate of the Philippines</StyledLink>
              <StyledLink href="https://congress.gov.ph" target="_blank" rel="noopener noreferrer">House of Representatives</StyledLink>
              <StyledLink href="https://sc.judiciary.gov.ph" target="_blank" rel="noopener noreferrer">Supreme Court</StyledLink>
              <StyledLink href="https://ca.judiciary.gov.ph" target="_blank" rel="noopener noreferrer">Court of Appeals</StyledLink>
              <StyledLink href="https://sb.judiciary.gov.ph" target="_blank" rel="noopener noreferrer">Sandiganbayan</StyledLink>
            </FrameThree>
          </FrameTwo>
          <FrameTwo>
            <LinksTitle theme={currentTheme}>GOV.PH</LinksTitle>
            <FrameThree>
              <StyledLink href="https://data.gov.ph" target="_blank" rel="noopener noreferrer">
                Open Data Portal
              </StyledLink>
              <StyledLink href="https://www.officialgazette.gov.ph" target="_blank" rel="noopener noreferrer">
                Official Gazette
              </StyledLink>
            </FrameThree>
          </FrameTwo>
          <FrameFour>
            <PagesTitle theme={currentTheme}>Pages</PagesTitle>
            {[
              { href: "https://www.panahon.gov.ph/", label: "Hydro-Met", external: true },
              { href: "https://hazardhunter.georisk.gov.ph/map", label: "Hazard Map", external: true },
              { href: "/", label: "Wave" },
              { href: "/services", label: "Services", external: true },
              { href: "/blog", label: "Blog", external: true },
            ].map(({ href, label, external }) => (
              <StyledLink
                key={label}
                href={href}
                theme={currentTheme}
                style={{ textDecoration: 'none' }}
                {...(external && { target: "_blank", rel: "noopener noreferrer" })}
              >
                {label}
              </StyledLink>
            ))}
          </FrameFour>
        </LinksContainer>
      </FlexRow>

      <LineImage src={line1} alt="Separator line" />

      <RightsReservedContainer>
        <RightsText theme={currentTheme}>
          ©   2025 Philippine Atmospheric, Geophysical and Astronomical Services Administration (PAGASA).
          All rights reserved.
        </RightsText>
      </RightsReservedContainer>
    </FooterContainer>
  );
};

export default Footer;
