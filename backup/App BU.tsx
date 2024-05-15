// Frameworks
import React, { useState }   from 'react';
import {AppShell, Button, Modal, Flex} from '@mantine/core'

import WorkerCalendar from '../src/components/WorkerCalendar'
import WorkerList from '../src/components/WorkerList';
import LoginModal from '../src/components/LoginModal';
import WorkerModal from '../src/components/NewWorker';
import AbsenceModal from '../src/components/NewAbsence';

interface Credential {
   username: string;
   password: string;
}

interface CredentialsResponse {
   credentials: Credential[];
}

const App: React.FC = () => {
   const [isLoggedIn, setIsLoggedIn] = useState(false);
   const [showLoginModal, setShowLoginModal] = useState(false);
   const [showNewWorkerModal, setShowNewWorkerModal] = useState(false);
   const [showNewAbsenceModal, setShowNewAbsenceModal] = useState(false);

   const handleLoginSuccess = async (username: string, password: string) => {
      const response = await fetch('/api/getloginferias');
      console.log(response);
      const data: CredentialsResponse = await response.json();
      const userExists = data.credentials.some((cred: Credential) => cred.username === username && cred.password === password);
      console.log(isLoggedIn);
      if (userExists){
         setIsLoggedIn(true);
         setShowLoginModal(false);
      } else { alert('Credenciais Inválidas'); }
   };

  // Modal close handlers - simplified without the need for success callbacks
   const handleLoginClose = () => { setShowLoginModal(false); }
   const handleWorkerClose = () => { setShowNewWorkerModal(false); }
   const handleAbsenceClose = () => { setShowNewAbsenceModal(false); }

   return (
      <>
         <AppShell
         layout='alt'
         header={{height:100}}
         navbar={{
            width: {sm: 200, md: 300, lg: 400},
            breakpoint: 'sm'
         }}>
         
            <AppShell.Header py={"auto"}>   
               <Flex
               ml={"25px"}
               h={"100%"}
               mih={50}
               gap="sm"
               justify="flex-start"
               align="center"
               direction="row"
               wrap="wrap"
               >
                  {isLoggedIn ? ( 
                     <>
                        <Button onClick={() => setShowNewWorkerModal(true)}>Novo Colaborador</Button>
                        <Button onClick={() => setShowNewAbsenceModal(true)}>Adicionar Ausência</Button>  
                        <Button>Imprimir</Button>
                     </>
                  ) : ( 
                     <Button onClick={() => setShowLoginModal(true)}>Editar dados</Button> 
                  )}
               </Flex>
            </AppShell.Header>
            
            <AppShell.Navbar>
               <WorkerList />
            </AppShell.Navbar>

            <AppShell.Main>
               <Modal
               opened={showLoginModal}
               onClose={() => setShowLoginModal(false)}
               title="Login"
               centered
               withCloseButton={false}
               className='formModal'
               overlayProps={{
                  backgroundOpacity: 0.55,
                  blur: 3,
               }}            
               style={{
                  left: "0%",
                  position: "absolute"
               }} >
                  <LoginModal 
                  onLoginSuccess={handleLoginSuccess} 
                  onClose={handleLoginClose}
                  />
               </Modal>

               <Modal
               opened={showNewWorkerModal}
               onClose={() => setShowNewWorkerModal(false)}
               title="Novo Colaborador"
               centered
               withCloseButton={false}
               className='formModal'
               overlayProps={{
                  backgroundOpacity: 0.55,
                  blur: 3,
               }}               
               style={{
                  left: "0%",
                  position: "absolute"
               }} >                  
                  <WorkerModal onClose={handleWorkerClose} />
               </Modal>

               <Modal
               opened={showNewAbsenceModal}
               onClose={() => setShowNewAbsenceModal(false)}
               title="Nova Ausência"
               centered
               withCloseButton={false}
               className='formModal'
               overlayProps={{
                  backgroundOpacity: 0.55,
                  blur: 3,
               }}               
               style={{
                  left: "0%",
                  position: "absolute"
               }} >                  
                  <AbsenceModal onClose={handleAbsenceClose} />
               </Modal>
               <WorkerCalendar/>
            </AppShell.Main>

         </AppShell>
      </>
   );
};

export default App;