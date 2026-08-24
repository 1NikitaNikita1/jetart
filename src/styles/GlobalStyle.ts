import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html,
  body,
  #root {
    width: 100%;
    min-height: 100%;
    margin: 0;
    height: 100%;
  }

  body {
    font-family: Arial, sans-serif;
    background: #111;
    color: white;
  }
`;
