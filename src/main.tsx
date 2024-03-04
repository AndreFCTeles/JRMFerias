import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import App from './App.tsx'
import '@mantine/core/styles.css';
import './index.css'

const theme = {
  breakpoints: {sm: '300px' },
  navbar: {breakpoint: null}
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <MantineProvider theme={theme}>
    <App />
  </MantineProvider>,
);
