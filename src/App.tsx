// Frameworks
import React  from 'react';
import {AppShell} from '@mantine/core'
import MyTimeline from './components/Timeline'; // Assuming you have this from the previous steps

const App: React.FC = () => {

   return (
      <AppShell
      layout='alt'
      header={{height:100}}
      navbar={{
         width: {sm: 200, md: 300, lg: 400},
         breakpoint: 'sm'
      }}>
         <AppShell.Header>
         </AppShell.Header>
         
         <AppShell.Navbar>
         </AppShell.Navbar>

         <AppShell.Main>
            <MyTimeline />
         </AppShell.Main>
      </AppShell>
   );
};

export default App;
