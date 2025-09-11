// Dependências
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { ContextMenuProvider } from "mantine-contextmenu";

// Componente Principal
import App from './App.tsx'

import '@mantine/core/styles.css';
//import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import 'mantine-contextmenu/styles.css'
import './styles/App.css'
import './styles/index.css';
import './styles/print.css'

// Estilos
const theme = {
  breakpoints: {sm: '300px' },
  navbar: {breakpoint: null}
}

// Renderizar aplicação
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <MantineProvider theme={theme}>
    <Notifications />
    <ModalsProvider>
      <ContextMenuProvider>
        <App />
      </ContextMenuProvider>
    </ModalsProvider>
  </MantineProvider>,
);
