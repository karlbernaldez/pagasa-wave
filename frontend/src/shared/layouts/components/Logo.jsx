// src/components/PagasaLogo.js
import React from "react";
import styled from "styled-components";

const StyledPagasaLogo = styled.div`
  background-image: url("/pagasa-logo.png"); // Public folder path
  background-position: center;
  background-size: cover;
  height: 30px;
  width: 30px;
`;

export const PagasaLogo = ({ className }) => {
  return <StyledPagasaLogo className={className} />;
};
