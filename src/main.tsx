import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { ContextMenuProvider } from "mantine-contextmenu";

import App from './App.tsx'

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import 'mantine-contextmenu/styles.css'
import './styles/App.css'
import './styles/index.css';
import './styles/print.css'

const theme = {
  breakpoints: {sm: '300px' },
  navbar: {breakpoint: null}
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <MantineProvider theme={theme}>
    <ContextMenuProvider>
      <App />
    </ContextMenuProvider>
  </MantineProvider>,
);
