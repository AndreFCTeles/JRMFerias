/* |--- IMPORTS ---| */

// Frameworks
import React, { 
   useState, 
   useEffect, 
   useCallback, 
   useRef, 
   useMemo, 
   memo 
} from 'react';
import { 
   AppShell, 
   Button, 
   Modal, 
   Flex, 
   Drawer, 
   Notification, 
   Tooltip, 
   Title,
   Box, 
   Text, 
   ScrollArea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { 
   useDisclosure
} from '@mantine/hooks';
// Types
import { 
   JRMWorkerData, 
   CredentialSafe,
   CalendarEvent, 
   DepartmentData, 
   Selections,
   Role,
   CalendarView, 
   NameDisplay,
   APP_NAME,
   LS_KEEP,
   LS_NAME_DISPLAY,
   LS_VIEW,
   LS_AUTH
} from './utils/types';
// Utils
import login from './utils/auth';
import fetchAbsences from './utils/absences/fetchAbsences';
import fetchWorkers from './utils/workers/fetchWorkers';
import fetchDepartments from './utils/workers/fetchDepartments';
import deleteWorker from './utils/workers/deleteWorker';
// Components
import LoginModal from './components/LoginModal';
import SettingsMenu from './components/SettingsMenu';
import ChangePassword from './components/ChangePassword';
import PrintCalendar from './components/PrintCalendar';
import WorkerList from './components/WorkerList';
import WorkerModal from './components/NewWorker';
import WorkerCalendar from './components/WorkerCalendar';









/* |--- COMPONENT ---| */
const App: React.FC = () => {

   /* |--- STATES ---| */
   // Autenticação e níveis de acesso
   const [showLoginModal, setShowLoginModal] = useState(false); // ------------------------------ Mostra modal de login
   const [isLoggedIn, setIsLoggedIn] = useState(false); // -------------------------------------- Ativa/muda elementos UI após login
   const [authUser, setAuthUser] = useState<CredentialSafe | null>(null); // -------------------- Muda acesso a funcionalidades consoante autorização de login
   const [authBooting, setAuthBooting] = useState(true);
// const roleRank: Record<Role, number> = { user: 0, editor: 1, admin: 2, superadmin: 3 }; // --- Mapeia e simplifica os níveis de acesso para lógica
   // Comportamento da UI
   const [showChangePw, setShowChangePw] = useState(false); // ---------------------------------- Comportamento de modal de mudança de password
   const [triggerOpenModal, setTriggerOpenModal] = useState(false); // -------------------------- Interação com calendário abre modal de evento
   const [showNewWorkerModal, setShowNewWorkerModal] = useState(false); // ---------------------- Comportamento de modal de colaborador
   const [opened, { open, close }] = useDisclosure(false); // ----------------------------------- Comportamento do modo de impressão
   const [isPrintMode, setIsPrintMode] = useState(false); // ------------------------------------ Esconder elementos de UI para impressão
   const [navOpened, { toggle: toggleNav }] = useDisclosure(true); // --------------------------- Comportamento da navbar (WorkerList)
   // Inicialização dos dados da UI
   const [workers, setWorkers] = useState<JRMWorkerData[]>([]); // ------------------------------ Todos os colaboradores
   const [currentWorker, setCurrentWorker] = useState<JRMWorkerData | null>(null); // ----------- Colaborador a ser editado
   const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]); // ---------------- Todas as ausências, férias ou feriados
   const [departments, setDepartments] = useState<string[]>([]); // ----------------------------- Todos os departamentos encontrados nos dados de colaborador
   const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]); // --------------- Todos os departamentos
   const filtersInitializedRef = useRef(false); // ---------------------------------------------- inicialização de eventos filtrados pela seleção de colaboradores
   // Opções de utilizador para UI   
// const [view, setView] = useState<'dayGridMonth' | 'multiMonthYear'>('dayGridMonth'); // ------ Vista do calendário (old)
   const [view, setView] = // ------------------------------------------------------------------- Vista do calendário
      useState<CalendarView>(() => (
         (localStorage.getItem(LS_VIEW) as CalendarView) || 'dayGridMonth'
      ));
   const [nameDisplay, setNameDisplay] = // ----------------------------------------------------- Vista de nomes WorkerList
      useState<NameDisplay>(() => (
         (localStorage.getItem(LS_NAME_DISPLAY) as NameDisplay) || 'displayName'
      ));
   const [persistLogin, setPersistLogin] =  // -------------------------------------------------- Mantém user ligado (skip login)
      useState<boolean>(() => {
         return localStorage.getItem(LS_KEEP) === '1';
      });
   // Contagem de departamentos para validação de formulário (departamentos órfãos)
   const depCounts = useMemo(() => {
      const m = new Map<string, number>();
      for (const d of workers) m.set(d.dep, (m.get(d.dep) ?? 0) + 1); //for (const d of departmentData) m.set(d.depName, (m.get(d.depName) ?? 0) + 1);
      return m;
   }, [workers]); //}, [departmentData]);
   // Sistema de notificações
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
   const showNotification = useCallback((title: string, message: string | React.ReactNode, color: string) => {
      setNotification({
         visible: true,
         title,
         message,
         color,
      });
      setTimeout(() => { setNotification((prevState) => ({ ...prevState, visible: false })); }, 5000);
   }, []);
   // Inicialização de Filtragem/Checkboxes   
   const [selections, setSelections] = useState<Selections>({ workers: [], departments: [] });
   const idsForDepartment = useCallback((depName: string) => workers.filter(w => w.dep === depName).map(w => w.id), [workers]);
   const onToggleWorker = useCallback((workerId: string, depName: string) => {
      setSelections(prev => {
         const isSelected = prev.workers.includes(workerId);
         const workersNext = isSelected
            ? prev.workers.filter(id => id !== workerId)
            : [...prev.workers, workerId];
         const deptIds = idsForDepartment(depName);
         const allDeptSelected = deptIds.length > 0 && deptIds.every(id => workersNext.includes(id));
         const departmentsNext = allDeptSelected
            ? (prev.departments.includes(depName) ? prev.departments : [...prev.departments, depName])
            : prev.departments.filter(d => d !== depName);
         return { workers: workersNext, departments: departmentsNext };
      });
   }, [idsForDepartment]);
   const onToggleDepartment = useCallback((depName: string) => {
      setSelections(prev => {
         const deptIds = idsForDepartment(depName);
         const isDeptSelected = prev.departments.includes(depName);
         const workersNext = isDeptSelected
            ? prev.workers.filter(id => !deptIds.includes(id))
            : Array.from(new Set([...prev.workers, ...deptIds]));
         const departmentsNext = isDeptSelected
            ? prev.departments.filter(d => d !== depName)
            : [...prev.departments, depName];
         return { workers: workersNext, departments: departmentsNext };
      });
   }, [idsForDepartment]);
   // Validação de conta para permitir mudar password
   const canChangePassword = useMemo(() => {
      if (!authUser) return false;
      const globalRole = authUser.roles as Role | null;
      const appRole = authUser.apps?.[APP_NAME]?.roles as Role | undefined;

      // superadmin always allowed; else appRole > 'user' or (fallback) globalRole > 'user'
      const rank: Record<Role, number> = { user: 0, editor: 1, admin: 2, superadmin: 3 };
      if (globalRole === 'superadmin') return true;
      if (appRole && rank[appRole] > rank.user) return true;
      if (globalRole && rank[globalRole] > rank.user) return true;
      return false;
   }, [authUser]);




   /* |--- HANDLERS ---| */

   // Login
   const handleLoginSuccess = (user: CredentialSafe) => {
      setAuthUser(user);
      setIsLoggedIn(true);
      setShowLoginModal(false);
   };
   const handleLoginClose = () => { setShowLoginModal(false); } // IMPORTANTE - Separei close de open por causa de bugs com a tecla Esc
   const handlePersistToggle = useCallback((checked: boolean) => { setPersistLogin(checked); }, []); // passar computed canChangePassword 
   const handleLogout = useCallback(() => {
      setAuthUser(null);
      setIsLoggedIn(false);
      setPersistLogin(false);
      localStorage.removeItem(LS_KEEP);
      localStorage.removeItem(LS_AUTH);
      setShowChangePw(false);
   }, []);

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
         showNotification("Sucesso", "Colaborador eliminado com sucesso", "green");
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
   const calendarSizeAdjuster = () => {
      toggleNav(); 
      fetchAndUpdateWorkers();
   };





   
   /* |--- DATA FETCHING ---| */
   
   const fetchAndUpdateWorkers = async () => {
      try {
         console.log("App fetching data");

         const [fetchedWorkers, fetchedEvents, fetchedDeps] = await Promise.all([
            fetchWorkers(),
            fetchAbsences(),
            fetchDepartments() 
         ]);

         setWorkers(fetchedWorkers);
         const depList = fetchedDeps
            .slice()
            .sort((a, b) => a.depName.localeCompare(b.depName));
         setDepartmentData(depList);
         setDepartments(depList.map(d => d.depName));
         setCalendarEvents(fetchedEvents);
      } catch (error) { console.error("Erro ao buscar colaboradores", error); }
   };



   /* |--- EFFECTS ---| */

   // Inicialização dos dados
   useEffect(() => { fetchAndUpdateWorkers(); }, []);
   useEffect(()=>{ console.log("App rendered") }, [])
   // Inicialização de filtragem   
   useEffect(() => { // init apenas uma vez
      if (!filtersInitializedRef.current && departments.length && workers.length) {
         setSelections({ workers: workers.map(w => w.id), departments: departments });
         filtersInitializedRef.current = true;
      }
   }, [departments, workers]);
   useEffect(() => { // prune a seleções inválidas
      setSelections(prev => ({
         workers: prev.workers.filter(id => workers.some(w => w.id === id)),
         departments: prev.departments.filter(dep => departments.includes(dep)),
      }));
   }, [workers, departments]);

   // Inicialização de opções de utilizador
   useEffect(() => localStorage.setItem(LS_VIEW, view), [view]); // View do calendário
   useEffect(() => localStorage.setItem(LS_NAME_DISPLAY, nameDisplay), [nameDisplay]); // Nomes da WorkerList 
   useEffect(() => { // Manter user logged in
      if (persistLogin) {
         localStorage.setItem(LS_KEEP, '1');
      } else {
         localStorage.removeItem(LS_KEEP);
         localStorage.removeItem(LS_AUTH); // dropping stale saved creds
      }
   }, [persistLogin]);
   // Auto-login
   useEffect(() => {
      ( async () => {
         try {
            const keep = localStorage.getItem(LS_KEEP) === '1';
            const raw = localStorage.getItem(LS_AUTH);
            if (keep && raw) {
               // try auto-login
               const { username, password, app } = JSON.parse(raw);
               const { user } = await login(username, password, app || APP_NAME);
               handleLoginSuccess(user);
            } else if (!keep) {
               localStorage.removeItem(LS_AUTH); // ensure no stale creds if flag is off
            }
         } catch {
            localStorage.removeItem(LS_AUTH); // saved creds invalid → drop them
         } finally {
            setAuthBooting(false); // UI can render
         }
      } )();
   }, []);








   /* |--- JSX / RENDER APP ---| */
   
   return (
      <>
         <AppShell
         header={{ height: 100 }}
         navbar={{ 
            width: { sm: 200, md: 300, lg: 400 }, 
            breakpoint: 'sm',
            collapsed: {
               mobile: !navOpened, 
               desktop: !navOpened
            }
         }} >

            <AppShell.Header>

               <Flex h={"100%"} m={0} p={0} align={"center"}>
                  <Flex
                  className='headerTitle'
                  gap={0}
                  py="md"
                  h="100%"
                  align="center"
                  justify="center"
                  w={{ sm: 200, md: 300, lg: 400 }}
                  miw={{ sm: 200, md: 300, lg: 400 }}
                  onClick={calendarSizeAdjuster}
                  direction="column"
                  wrap="nowrap"
                  >
                     <Title 
                     order={3} 
                     h={"90%"}
                     p={{ sm: 0, md: "md" }} m={0} 
                     style={{ 
                        flexGrow: 5
                     }}
                     >Lista de Colaboradores</Title>
                     <Text
                     pt={0} 
                     m={0} 
                     h="10%"
                     style={{ 
                        flexGrow: 0
                     }}>{navOpened?"Esconder":"Mostrar"}</Text>
                  </Flex>

                  <Flex
                  ml="25px"
                  h="100%"
                  w="100%"
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
                              <Button ml="xs" onClick={handleOpenModal}>Nova Ausência</Button>
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
                           variant="transparent"
                           ml="50px"
                           onClick={fetchAndUpdateWorkers}
                           >Refrescar Calendário</Button>
                        </Tooltip>
                     </Box>

                     {/* View */}
                     <Flex mr="lg" align="center">
                        <SettingsMenu
                        calendarView={view}
                        onCalendarViewChange={setView}
                        nameDisplay={nameDisplay}
                        onNameDisplayChange={setNameDisplay}
                        persistLogin={persistLogin}
                        onPersistLoginChange={handlePersistToggle}
                        isLoggedIn={isLoggedIn}
                        onLogout={handleLogout}
                        onChangePassword={() => setShowChangePw(true)} 
                        canChangePassword={canChangePassword}
                        />
                     </Flex>
                  </Flex>
               </Flex>
            </AppShell.Header>

            {/* WorkerList */}
            <AppShell.Navbar>
               <WorkerList
               workers={workers}
               departments={departmentData}
               onWorkerEdit={handleWorkerEdit}
               onWorkerDelete={handleWorkerDelete}
               isLoggedIn={isLoggedIn}
               showNotification={showNotification}

               //selectedDepartments={selections.departments}
               selectedWorkers={selections.workers}
               onToggleWorker={onToggleWorker}
               onToggleDepartment={onToggleDepartment}
               nameDisplay={nameDisplay}
               />
            </AppShell.Navbar>

            <AppShell.Main>
               {/* Notifications */}
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
               {!authBooting && showLoginModal && (
                  <Modal
                  opened={showLoginModal}
                  onClose={() => setShowLoginModal(false)}
                  title="Login"
                  centered
                  withCloseButton={true}
                  closeOnClickOutside={false}
                  className='formModal'
                  overlayProps={{ 
                     backgroundOpacity: 0.55, 
                     blur: 3 
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
               )}

               {/* Change password */}
               <Modal
               opened={showChangePw}
               onClose={() => setShowChangePw(false)}
               title="Alterar palavra-passe"
               centered
               >
                  {authUser && (
                     <ChangePassword
                     user={authUser}
                     appName={APP_NAME}
                     onSuccess={() => {
                        setShowChangePw(false);
                        notifications?.show?.({ 
                           message: 'Palavra-passe atualizada', 
                           color: 'green' 
                        });
                     }}
                     onCancel={
                        () => setShowChangePw(false)
                     } />
                  )}
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
                  showNotification={showNotification}
                  currentWorker={currentWorker} 
                  departments={departmentData}
                  depCounts={depCounts}   
                  />
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

                  selectedDepartments={selections.departments}
                  selectedWorkers={selections.workers}
                  nameDisplay={nameDisplay}
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