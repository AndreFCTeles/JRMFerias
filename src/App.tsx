// Frameworks
import React, { useState, useEffect, useCallback, memo }   from 'react';
import { 
   AppShell, 
   Button, 
   Modal, 
   Flex, 
   Drawer, 
   Notification, 
   Tooltip, 
   SegmentedControl, 
   Box, 
   Text, 
   ScrollArea,
   Stack
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks';
// Types
import { JRMWorkerData, Credential, CredentialsResponse, CalendarEvent } from './utils/types';
// Utils
import fetchAbsences from './utils/absences/fetchAbsences';
import fetchWorkers from './utils/workers/fetchWorkers';
import deleteWorker from './utils/workers/deleteWorker';
// Components
import LoginModal from './components/LoginModal';
import PrintCalendar from './components/PrintCalendar';
import WorkerList from './components/WorkerList';
import WorkerModal from './components/NewWorker';
import WorkerCalendar from './components/WorkerCalendar';





// COMPONENT
const App: React.FC = () => {

   // STATES
   // modals
   const [showLoginModal, setShowLoginModal] = useState(false);
   const [showNewWorkerModal, setShowNewWorkerModal] = useState(false);
   const [opened, { open, close }] = useDisclosure(false);
   // UI
   const [view, setView] = useState<'dayGridMonth' | 'multiMonthYear'>('dayGridMonth');
   const [triggerOpenModal, setTriggerOpenModal] = useState(false);
   const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
   const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
   const [isLoggedIn, setIsLoggedIn] = useState(false);
   const [workers, setWorkers] = useState<JRMWorkerData[]>([]);
   const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
   const [departments, setDepartments] = useState<string[]>([]);
   const [isPrintMode, setIsPrintMode] = useState(false);
   const [currentWorker, setCurrentWorker] = useState<JRMWorkerData | null>(null);
   // notificações
   const [notification, setNotification] = useState<{
      visible: boolean;
      title: string;
      message: string | React.ReactNode;
      color: string;
   }>({
      visible: false,
      title: '',
      message: '',
      color: 'green',
   });
   /*
   const [notification, setNotification] = useState({
      visible: false,
      title: '',
      message: '',
      color: 'green',
   });
   */

   // Notification 
   const showNotification = useCallback((title: string, message: string | React.ReactNode, color: string) => {
      setNotification({
         visible: true,
         title,
         message,
         color,
      });
      setTimeout(() => { setNotification((prevState) => ({ ...prevState, visible: false })); }, 5000);
   }, []);

   // HANDLERS
   // Login
   const handleLoginSuccess = async (username: string, password: string) => {
      const response = await fetch('/api/ferias/getloginferias');
      const data: CredentialsResponse = await response.json();
      const userExists = data.credentials.some((cred: Credential) => cred.username === username && cred.password === password);
      if (userExists) {
         setIsLoggedIn(true);
         setShowLoginModal(false);
      } else { alert('Credenciais Inválidas'); }
   };
   const handleLoginClose = () => { 
      setShowLoginModal(false); // IMPORTANTE - Separei close de open por causa de bugs com a tecla Esc
   }
   // Worker handlers
   const handleWorkerEdit = (workerId: string) => {
      if (isLoggedIn) {
         const workerData = workers.find(worker => worker.id === workerId);
         if (!workerData) return;
         setCurrentWorker(workerData);
         setShowNewWorkerModal(true);
      }
   }
   const handleWorkerDelete = async (workerId: string) => {
      try {
         await deleteWorker(workerId);
         await fetchAndUpdateWorkers();
         showNotification("Successo", "Colaborador eliminado com sucesso", "green");
      } catch (error) {
         console.error('Erro ao eliminar colaborador:', error);
         showNotification("Erro", "Erro ao eliminar colaborador", "red");
      }
   };
   // Worker Modal handlers
   const handleNewWorkerOpen = () => {
      setCurrentWorker(null);
      setShowNewWorkerModal(true);
   };
   const handleNewWorkerClose = () => { 
      setCurrentWorker(null);
      setShowNewWorkerModal(false);
   };
   // UI handlers
   const handleOpenModal = () => { setTriggerOpenModal(true); };
   const resetTrigger = () => { setTriggerOpenModal(false); };
   const handleViewChange = useCallback((newView: 'dayGridMonth' | 'multiMonthYear') => { setView(newView); }, []);

   // App data fetching
   const fetchAndUpdateWorkers = async () => {
      try {
         console.log("App fetching data");
         const fetchedWorkers = await fetchWorkers();
         const fetchedEvents = await fetchAbsences();
         const fetchedDepartments = Array.from(new Set(fetchedWorkers.map(worker => worker.dep).filter((dep): dep is string => dep !== undefined))).sort();
         setDepartments(fetchedDepartments);
         setCalendarEvents(fetchedEvents);
         setWorkers(fetchedWorkers);
      } catch (error) { console.error("Erro ao buscar colaboradores", error); }
   };

   // EFFECTS
   // Inicialização dos dados
   useEffect(() => { fetchAndUpdateWorkers(); }, []);
   useEffect(()=>{ console.log("App rendered") }, [])
   // Inicialização de filtragem
   useEffect(() => {
      setSelectedDepartments(departments);
      setSelectedWorkers(workers.map(worker => worker.id));
   }, [departments, workers]);





   // JSX
   return (
      <>
         <AppShell
         layout='alt'
         header={{ height: 100 }}
         navbar={{ width: { sm: 200, md: 300, lg: 400 }, breakpoint: 'sm' }}
         >

         <AppShell.Header py="auto">
            <Flex
            ml="25px"
            h="100%"
            mih={50}
            gap="sm"
            justify="space-between"
            align="center"
            direction="row"
            wrap="wrap"
            >

               {/* Modal BTNs */}
               <Box>
                  <Button onClick={open}>Imprimir</Button>
                  {isLoggedIn ? (
                     <>
                        <Button ml="xs" onClick={handleNewWorkerOpen}>Novo Colaborador</Button>
                        <Button ml="xs" onClick={handleOpenModal}>Adicionar Ausência</Button>
                     </>
                  ) : (
                     <Button ml="xs" onClick={() => setShowLoginModal(true)}>Login</Button>
                  )}
                  <Tooltip
                  label="Refrescar calendário, caso os dados não sejam atualizados corretamente"
                  multiline
                  openDelay={300}
                  w={200}
                  >
                     <Button
                     variant="light"
                     ml="50px"
                     style={{ backgroundColor: "#FFF" }}
                     onClick={fetchAndUpdateWorkers}
                     >Refrescar Calendário</Button>
                  </Tooltip>
               </Box>

               {/* View */}
               <Flex mr="lg" align="center">
                  <Stack gap={0}>
                     <Text fw={700}>Vista</Text>
                     <SegmentedControl
                     color='blue'
                     radius="xl"
                     value={view}
                     onChange={(value) => handleViewChange(value as 'dayGridMonth' | 'multiMonthYear')}
                     data={[
                        { label: 'Mensal', value: 'dayGridMonth' },
                        { label: 'Anual', value: 'multiMonthYear' }
                     ]}
                     />
                  </Stack>
               </Flex>
            </Flex>
         </AppShell.Header>

         {/* WorkerList */}
         <AppShell.Navbar>
            <WorkerList
            workers={workers}
            onWorkerEdit={handleWorkerEdit}
            onWorkerDelete={handleWorkerDelete}
            isLoggedIn={isLoggedIn}
            showNotification={showNotification}

            selectedDepartments={selectedDepartments}
            setSelectedDepartments={setSelectedDepartments}
            selectedWorkers={selectedWorkers}
            setSelectedWorkers={setSelectedWorkers}
            />
         </AppShell.Navbar>

         <AppShell.Main>
            {/* Notifications */}{/*notification.message*/}
            {notification.visible && (
               <Notification
               withBorder
               color={notification.color}
               title={notification.title}
               style={{ 
                  position:"absolute", 
                  width: "70vw", 
                  zIndex: 199,
                  transition: "all 2s, ease-in-out 2s"
               }}
               onClose={
                  () => setNotification((prevState) => ({ ...prevState, visible: false }))
               }>
                  {typeof notification.message === "string" ? (
                     <Text>{notification.message}</Text>
                  ) : (notification.message)}
               </Notification> 
            )}

            {/* Login */}
            <Modal
            opened={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            title="Login"
            centered
            withCloseButton={true}
            closeOnClickOutside={false}
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
            closeOnClickOutside={false}
            className='formModal'
            overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}               
            style={{ left: "0%", position: "absolute" }} >                  
               <WorkerModal 
               onClose={handleNewWorkerClose} 
               onUpdateWorkers={fetchAndUpdateWorkers}
               currentWorker={currentWorker} 
               departments={departments}
               showNotification={showNotification} />
            </Modal>

            {/* Calendar */}          
            <ScrollArea
            style={{ height: 'calc(100% - 50px)' }} 
            type="auto">
               <WorkerCalendar
               key={isLoggedIn ? "logged-in" : "not-logged"}
               workers={workers}
               workerEvents={calendarEvents}
               isLoggedIn={isLoggedIn}
               view={view}
               showNotification={showNotification}
               fetchAndUpdateWorkers={fetchAndUpdateWorkers}
               triggerOpenModal={triggerOpenModal} 
               resetTrigger={resetTrigger}

               selectedDepartments={selectedDepartments}
               selectedWorkers={selectedWorkers}
               />
            </ScrollArea>
         </AppShell.Main>

         {/* Print */}
         <Drawer.Root
         radius="md"
         offset={isPrintMode ? 0 : "0.5vw"}
         opened={opened}
         onClose={close}
         left={0}
         top={0}
         size={isPrintMode ? "100vw" : "99vw"}
         style={{ position: "absolute" }}
         >
            <Drawer.Overlay />
            <Drawer.Content style={{
               display: 'flex',
               flexDirection: 'column',
               height: isPrintMode ? "100vw" : '98vh',
               width: isPrintMode ? "100vw" : "99vw"
            }}>
               <Drawer.Header style={{
                  display: isPrintMode ? 'none' : 'flex',
                  backgroundColor: '#269AFF',
                  color: '#FFF'
               }}>
                  {!isPrintMode && ( <>
                     <Drawer.Title fw={700}>Imprimir</Drawer.Title>
                     <Drawer.CloseButton color='white' />
                  </> )}
               </Drawer.Header>
               <Drawer.Body style={{ flex: 1 }} h="100%">
                  <PrintCalendar 
                  isPrintMode={isPrintMode} 
                  setIsPrintMode={setIsPrintMode} 
                  propWorkers={workers} 
                  />
               </Drawer.Body>
            </Drawer.Content>
         </Drawer.Root>

         </AppShell>
      </>
   );
};

export default memo(App);