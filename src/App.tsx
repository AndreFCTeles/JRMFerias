// Frameworks
import React, { useState, useEffect }   from 'react';
import { AppShell, Button, Modal, Flex, Drawer, Notification, Tooltip } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks';

// Interfaces
import { Worker, Credential, CredentialsResponse, CalendarEvent } from './utils/types';

// Utils
import fetchAbsences from './utils/absences/fetchAbsences';
import fetchWorkers from './utils/workers/fetchWorkers';
import deleteWorker from './utils/workers/deleteWorker';
import deleteAbsence from './utils/absences/deleteAbsence';

// Components
import WorkerList from './components/WorkerList';
import LoginModal from './components/LoginModal';
import WorkerModal from './components/NewWorker';
import AbsenceModal from './components/NewAbsence';
import WorkerCalendar from './components/WorkerCalendar'
import PrintCalendar from './components/PrintCalendar';



// APP Component
const App: React.FC = () => {

   //STATES
   // modals
   const [showLoginModal, setShowLoginModal] = useState(false);
   const [showNewWorkerModal, setShowNewWorkerModal] = useState(false);
   const [showNewAbsenceModal, setShowNewAbsenceModal] = useState(false);   
   // triggers
   const [isLoggedIn, setIsLoggedIn] = useState(false);
   const [calendarRefreshTrigger, setCalendarRefreshTrigger] = useState(false);
   const [workers, setWorkers] = useState<Worker[]>([]);
   const [events, setEvents] = useState<CalendarEvent[]>([]);
   const [departments, setDepartments] = useState<string[]>([])
   // imprimir
   const [opened, { open, close }] = useDisclosure(false);
   const [isPrintMode, setIsPrintMode] = useState(false);
   // editar dados
   const [currentWorker, setCurrentWorker] = useState<Worker | null>(null);
   const [currentEvent, setCurrentEvent] = useState<CalendarEvent | null>(null);
   // notificações
   const [notification, setNotification] = useState({
      visible: false,
      title: '',
      message: '',
      color: 'green',
   });



   // HANDLERS
   const handleLoginSuccess = async (username: string, password: string) => {
      const response = await fetch('/api/getloginferias');
      const data: CredentialsResponse = await response.json();
      const userExists = data.credentials.some((cred: Credential) => cred.username === username && cred.password === password);
      
      if (userExists){
         setIsLoggedIn(true);
         setShowLoginModal(false);
      } else { alert('Credenciais Inválidas'); }
   };
   // Worker handlers
   const handleWorkerEdit = (workerId: string) => {   
      if (isLoggedIn){
         const workerData = workers.find(worker => worker.id === workerId);
         if (!workerData) return;      
         setCurrentWorker(workerData);     
         setShowNewWorkerModal(true);
      }
   };
   const handleWorkerDelete = async (workerId: string) => {
      try {
         await deleteWorker(workerId);
         await fetchAndUpdateWorkers();
         showNotification("Successo", "Colaborador eliminado com sucesso", "green");
         triggerCalendarRefresh();
      } catch (error) {
         console.error('Erro ao eliminar colaborador:', error);
         showNotification("Erro", "Erro ao eliminar colaborador", "red");
      }
   };
   // Event handlers
   const handleEventEdit = (eventId: string) => {   
      if (isLoggedIn){
         const eventToEdit  = events.find(event => event.eventId === eventId);
         if (eventToEdit) {
            setCurrentEvent(eventToEdit);
            setShowNewAbsenceModal(true);
            triggerCalendarRefresh();
         } else { console.error("Event not found:", eventId); }
      }
   };
   const handleEventDelete = async (eventId: string) => {
      try {
         await deleteAbsence(eventId);
         showNotification("Success", "Ausência eliminada com sucesso", "green");
         triggerCalendarRefresh();
      } catch (error) {
         console.error('Error deleting worker:', error);
         showNotification("Error", "Erro ao eliminar ausência", "red");
      }
   };

   // Sistema de notificações
   const showNotification = (title: string, message: string, color: string) => {
      setNotification({
         visible: true,
         title,
         message,
         color,
      });
      setTimeout(() => { setNotification((prevState) => ({ ...prevState, visible: false })); }, 3000);
   };

   // Resetters/re-renderers/Estados de Modals
   const triggerCalendarRefresh = () => setCalendarRefreshTrigger(prev => !prev);
   const handleLoginClose = () => { setShowLoginModal(false); }
   // IMPORTANTE - Separei close de open por causa de bugs com a tecla Esc
   const handleNewWorkerClose = () => { 
      setCurrentWorker(null);
      setShowNewWorkerModal(false); };
   const handleNewWorkerOpen = () => {
      setCurrentWorker(null);
      setShowNewWorkerModal(true);
   };
   // O mesmo para absences   
   const handleAbsenceClose = () => { 
      setCurrentEvent(null);
      setShowNewAbsenceModal(false); };
   const handleAbsenceOpen = () => {
      setCurrentEvent(null);
      setShowNewAbsenceModal(true);
   };

   // Fetching, Updating WorkerList
   const fetchAndUpdateWorkers = async () => {
      try {
         const fetchedWorkers = await fetchWorkers();
         const fetchedEvents = await fetchAbsences();
         const fetchedDepartments = Array.from(new Set(fetchedWorkers.map(worker => worker.dep).filter((dep): dep is string => dep !== undefined))).sort();
         setDepartments(fetchedDepartments);
         setEvents(fetchedEvents);
         setWorkers(fetchedWorkers);
      } catch (error) { console.error("Erro ao buscar colaboradores", error); }
   };
   useEffect(() => { fetchAndUpdateWorkers(); }, []); 


   //TSX
   return (
      <>
         <AppShell
         layout='alt'
         header={{height:100}}
         navbar={{ width: {sm: 200, md: 300, lg: 400}, breakpoint: 'sm' }}
         >

            <AppShell.Header py={"auto"}>   
               <Flex
               ml={"25px"}
               h={"100%"}
               w={"100%"}
               mih={50}
               gap="sm"
               justify="flex-start"
               align="center"
               direction="row"
               wrap="wrap"
               >
                  <Button onClick={open}>Imprimir</Button>
                  {isLoggedIn ? ( 
                     <>
                        <Button onClick={handleNewWorkerOpen}>Novo Colaborador</Button>
                        <Button onClick={handleAbsenceOpen}>Adicionar Ausência</Button>  
                     </>
                  ) : ( <Button onClick={() => setShowLoginModal(true)}>Login</Button> )}
                  <Tooltip 
                  label="Refrescar calendário, caso os dados não sejam atualizados corretamente"
                  multiline openDelay={300}
                  w={200}
                  >
                     <Button 
                     variant="light" 
                     ml={"50px"} 
                     style={{backgroundColor: "#FFF"}}
                     onClick={triggerCalendarRefresh}
                     >Refrescar Calendário</Button>
                  </Tooltip>
               </Flex>
            </AppShell.Header>

            <AppShell.Navbar >
               <WorkerList 
               workers={workers} 
               onWorkerEdit={handleWorkerEdit} 
               onWorkerDelete={handleWorkerDelete}
               isLoggedIn={isLoggedIn}
               showNotification={showNotification}
               />
            </AppShell.Navbar>

            <AppShell.Main>
               {notification.visible && (
                  <Notification
                  withBorder
                  color={notification.color}
                  title={notification.title}
                  style={{ position:"absolute", width: "70vw", zIndex: 199 }}
                  onClose={() => setNotification((prevState) => ({ ...prevState, visible: false }))}
                  >{notification.message}</Notification>
               )}

               {/* Login */}
               <Modal
               opened={showLoginModal}
               onClose={() => setShowLoginModal(false)}
               title="Login"
               centered
               withCloseButton={false}
               className='formModal'
               overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}            
               style={{ left: "0%", position: "absolute" }} >
                  <LoginModal 
                  onLoginSuccess={handleLoginSuccess} 
                  onClose={handleLoginClose}
                  />
               </Modal>

               {/* NewWorker */}
               <Modal
               opened={showNewWorkerModal}
               onClose={handleNewWorkerClose}
               title={currentWorker ? "Editar Colaborador" : "Novo Colaborador"}
               centered
               withCloseButton={true}
               className='formModal'
               overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}               
               style={{ left: "0%", position: "absolute" }} >                  
                  <WorkerModal 
                  departments={departments}
                  currentWorker={currentWorker} 
                  onClose={handleNewWorkerClose} 
                  onUpdateWorkers={fetchAndUpdateWorkers}
                  showNotification={showNotification} />
               </Modal>

               {/* NewAbsence */}
               <Modal
               opened={showNewAbsenceModal}
               onClose={() => setShowNewAbsenceModal(false)}
               title="Nova Ausência"
               centered
               withCloseButton={true}
               className='formModal'
               overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}               
               style={{ left: "0%", position: "absolute" }} >                  
                  <AbsenceModal 
                  onClose={handleAbsenceClose} 
                  onUpdateAbsences={triggerCalendarRefresh} 
                  currentEvent={currentEvent}
                  />
               </Modal>

               {/* Calendar */}
               <WorkerCalendar 
               refreshTrigger={calendarRefreshTrigger} 
               onEventEdit={handleEventEdit}
               onEventDelete={handleEventDelete}
               showNotification={showNotification}
               isLoggedIn={isLoggedIn}
               />
            </AppShell.Main>
               
            <Drawer.Root
            radius="md"
            offset={isPrintMode? 0 : "0.5vw"} 
            opened={opened} 
            onClose={close}
            left={0}
            top={0}
            size={isPrintMode? "100vw" : "99vw"}
            style={{position: "absolute"}} >
               <Drawer.Overlay />
                  <Drawer.Content style={{
                     display: 'flex', 
                     flexDirection: 'column', 
                     height: isPrintMode? "100vw" : '98vh', 
                     width: isPrintMode? "100vw" : "99vw" 
                  }}>
                     <Drawer.Header style={{ 
                        display: isPrintMode ? 'none' : 'flex', 
                        backgroundColor:'#269AFF',
                        color: '#FFF'
                     }}>
                        {!isPrintMode && ( <>
                           <Drawer.Title fw={700}>Imprimir</Drawer.Title>
                           <Drawer.CloseButton color='white'/>
                        </> )}
                     </Drawer.Header>
                     <Drawer.Body style={{ flex: 1 }} h={"100%"}>
                        <PrintCalendar isPrintMode={isPrintMode} setIsPrintMode={setIsPrintMode} />
                     </Drawer.Body>
                  </Drawer.Content>               
            </Drawer.Root> 
         </AppShell>
      </>
   );
};

export default App;