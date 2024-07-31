//Frameworks
import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { Tooltip, Notification, Modal, Text, Button, Group, Menu } from '@mantine/core';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import multiMonthPlugin from '@fullcalendar/multimonth';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { DatesSetArg } from '@fullcalendar/core/index.js';
import ptLocale from '@fullcalendar/core/locales/pt';
import dayjs from 'dayjs';
import 'dayjs/locale/pt';
dayjs.locale('pt');
// Components
import AbsenceModal from './NewAbsence';
// Types
import { CalendarEvent, JRMWorkerData } from '../utils/types';
// Utils
import { processDate, isWeekend } from '../utils/generalUtils';
import fetchHolidays from '../utils/absences/fetchHolidays';
import updateAbsence from '../utils/absences/updateAbsence';
import deleteAbsence from '../utils/absences/deleteAbsence';

// Props
interface WorkerCalendarProps {
   workers: JRMWorkerData[];
   workerEvents: CalendarEvent[];
   isLoggedIn: boolean;
   view: 'dayGridMonth' | 'multiMonthYear';
   fetchAndUpdateWorkers: () => void;
   triggerOpenModal: boolean;
   resetTrigger: () => void;
   showNotification: (title: string, message: string, color: string) => void;
}





// COMPONENT
const WorkerCalendar: React.FC<WorkerCalendarProps> = ({ 
   workers,
   workerEvents, 
   isLoggedIn, 
   view, 
   fetchAndUpdateWorkers,
   triggerOpenModal,
   resetTrigger,
   showNotification
}) => {
   // STATES/VARS
   // functionality
   const [error, setError] = useState<string | null>(null);
   const [isConfirmEventDelOpen, setIsConfirmEventDelOpen] = useState(false);   
   const [showNewAbsenceModal, setShowNewAbsenceModal] = useState(false);
   const [selectedDate, setSelectedDate] = useState<Date | null>(null);
   const [currentEvent, setCurrentEvent] = useState<CalendarEvent | null>(null);
   // 'current' states
   const [currentYearInView, setCurrentYearInView] = useState(new Date().getFullYear());
   const [lastMonthInView, setLastMonthInView] = useState(new Date().getMonth());
   // events
   const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
   const [localEvents, setLocalEvents] = useState<CalendarEvent[]>([]);
   // trackers for default values
   const calendarRef = useRef<FullCalendar>(null);
   // notifications
   const [notification, setNotification] = useState({
      visible: false,
      title: '',
      message: '',
      color: 'green',
   });






   // DATA FETCHING   
   const fetchEvents = useCallback(async (year: number) => {
      console.log("Worker Calendar fetching data");
      setError(null);
      try {
         const currentYearHolidays = await fetchHolidays(year);
         const combinedEvents = [
            ...(workerEvents || []),
            ...(currentYearHolidays || [])
         ];
         setLocalEvents(combinedEvents);
      } catch (error) {
         console.error('Error fetching events:', error);
         setError('Ocorreu um problema ao carregar dados. Por favor tente mais tarde.');
      }
   }, [workerEvents]);



   // HANDLERS
   // Inicialização de dados
   const handleDatesSet = useCallback(({ start }: DatesSetArg) => {
      if (calendarRef.current) {
         const calendarApi = calendarRef.current.getApi();
         const currentView = calendarApi.view.type;                  
         setCurrentYearInView(start.getFullYear());
         if (currentView === 'dayGridMonth') { 
            setLastMonthInView(start.getMonth()); 
         }
      }
   }, []);   

   // Editar eventos
   const handleEventEdit = useCallback(async (eventId: string, start?: string, end?: string) => {
      if (isLoggedIn) {
         const eventToEdit = workerEvents.find(calendarEvent => calendarEvent.eventId === eventId);
         if (eventToEdit) {
            setCurrentEvent(eventToEdit);
            if (start && end) {
               const updatedEvent = { ...eventToEdit, start, end };
               try {
                  await updateAbsence(workers, eventId, updatedEvent);
                  showNotification("Successo", "Evento atualizado com sucesso", "green");
                  await fetchAndUpdateWorkers();
               } catch (error) {
                  console.error("Error updating event:", error);
                  showNotification("Error", "Erro ao atualizar evento", "red");
               }
            } else { setShowNewAbsenceModal(true); }
         } else {
            console.error("Event not found:", eventId);
            showNotification("Error", "Evento não encontrado", "red");
         }
      }
   }, [isLoggedIn, workerEvents, workers, fetchAndUpdateWorkers, showNotification]);

   // Eliminar eventos
   const handleEventDelete = useCallback(async (eventId: string) => {
      try {
         await deleteAbsence(eventId);
         await fetchAndUpdateWorkers();
         showNotification("Success", "Ausência eliminada com sucesso", "green");
      } catch (error) {
         console.error('Error deleting absence:', error);
         showNotification("Error", "Erro ao eliminar ausência", "red");
      }
   }, [fetchAndUpdateWorkers, showNotification]);

   // Fechar Modal
   const handleNewAbsenceClose = () => {
      setCurrentEvent(null);
      setShowNewAbsenceModal(false);
   };
   
   // Double-click: Criar nova ausência em dia vazio
   const handleDateDoubleClick = (arg: DateClickArg) => {
      console.log("Double-click detected. isLoggedIn:", isLoggedIn);
      if (isLoggedIn) {
         setSelectedDate(arg.date);
         setShowNewAbsenceModal(true);
      } else {
         showNotification("Ação necessária", 'Por favor clique em "Login" e introduza as suas credenciais de acesso para efetuar esta operação', "red");
      }
   };
   
    // Double-click: Editar ausência existente
   const eventDCHandler = useCallback((eventId: string) => {
      console.log("Double-click detected. isLoggedIn:", isLoggedIn);
      if (isLoggedIn) { handleEventEdit(eventId); } 
      else {
         showNotification(
            "Ação necessária", 
            'Por favor clique em "Login" e introduza as suas credenciais de acesso para efetuar esta operação', 
            "red"
         );
      }
   }, [isLoggedIn, handleEventEdit, showNotification]);

   // Confirmar edição de dados de Modal
   const handleConfirm = async () => {
      if (selectedEventId) {
         handleEventDelete(selectedEventId);
         setIsConfirmEventDelOpen(false);
         setSelectedEventId(null);
      }
   };

   // Processar dados para uso com FullCalendar
   const getAdjustedEventsForDisplay = useCallback(() => {
      return localEvents.map(processedEvent => ({
         ...processedEvent,
         id: `${processedEvent.id}-${processedEvent.start}`,
         end: processedEvent.end ? processDate(processedEvent.end, 1) : undefined,
         originalEnd: processedEvent.end,
         backgroundColor: processedEvent.backgroundColor
      }));
   }, [localEvents]);




   // EFFECTS
   // Inicialização de dados consoante ano - multiMonthYear view
   useEffect(() => { fetchEvents(currentYearInView); }, [currentYearInView, fetchEvents]);

   // Ajustes/workarounds para mudança de view
   useEffect(() => {
      requestAnimationFrame(() => {
         if (calendarRef.current) {
            const calendarApi = calendarRef.current.getApi();
            calendarApi.changeView(view);
            if (view === 'dayGridMonth') {
               const lastMonthDate = new Date(currentYearInView, lastMonthInView, 1);
               calendarApi.gotoDate(lastMonthDate);
            } else if (view === 'multiMonthYear') {
               calendarApi.gotoDate(new Date(currentYearInView, 0, 1)); // Navegar para 1 de Janeiro
            }
         }
      });
   }, [view, currentYearInView, lastMonthInView]);

   // Abertura de Modal através de App
   useEffect(() => {
      if (triggerOpenModal) {
         setShowNewAbsenceModal(true);
         resetTrigger(); // Notificar App para refrescar calendário
      }
   }, [triggerOpenModal, resetTrigger]);

   useEffect(()=>{ console.log("WorkerCalendar rendered") }, [])




   // JSX
   return (
      <>
         {error && ( <Notification color="red" onClose={() => setError(null)}> {error} </Notification> )}                  
         {notification.visible && (
            <Notification
            withBorder
            color={notification.color}
            title={notification.title}
            style={{ position: "absolute", width: "70vw", zIndex: 199 }}
            onClose={() => setNotification((prevState) => ({ ...prevState, visible: false }))}
            >{notification.message}</Notification>
         )}

         {/* Calendar */}
         <FullCalendar
         ref={calendarRef}
         locale={ptLocale}
         firstDay={0}
         height="83vh"
         contentHeight={"100%"}
         plugins={[dayGridPlugin, multiMonthPlugin, interactionPlugin]}
         initialView={view}
         scrollTimeReset={false}
         headerToolbar={{
            left: 'prev next',
            center: 'title',
            right: ''
         }}
         views={{
            dayGridMonth: {
               type: 'dayGridMonth',
               buttonText: 'Monthly',
               showNonCurrentDates: false
            },
            multiMonthYear: {
               type: 'multiMonthYear',
               duration: { months: 12 },
               buttonText: 'Yearly',
               visibleRange: () => {
                  return {
                     start: new Date(currentYearInView, 0, 1), // January 1st
                     end: new Date(currentYearInView, 11, 31)  // December 31st
                  };
               },
               titleFormat: { year: 'numeric' }
            },
         }}
         titleFormat={{ month: 'long', year: 'numeric' }}
         editable={isLoggedIn} 
         events={getAdjustedEventsForDisplay()}
         dayCellClassNames={(arg) => (isWeekend(arg.date) ? "weekend" : "")}
         eventContent={({ event }) => {
            // Formatar datas para leitura de tooltip
            const formattedStartDate = event.start ? dayjs(processDate(event.start)).format("D MMMM") : '';
            const formattedEndDate = dayjs(event.extendedProps.originalEnd ? processDate(event.extendedProps.originalEnd) : formattedStartDate).format("D MMMM");
            const tooltipContent = formattedStartDate !== formattedEndDate
                                 ? `${event.title}:\n De ${formattedStartDate} a ${formattedEndDate}`
                                 : `${event.title}: ${formattedStartDate}`;
            const backgroundEvent = <div>{view === 'dayGridMonth'? event.title : 'Feriado'}</div>;

            const regularEvent = <Tooltip 
               multiline
               w={200}
               withArrow
               arrowOffset={50} 
               arrowSize={8}
               label={tooltipContent}
               transitionProps={{ transition: 'slide-down', duration: 300 }}
               ><div style={event._def.allDay ? { 
                  backgroundColor: `${event._def.ui.backgroundColor}`
               } : { // Estilos para ausências parciais
                  backgroundColor: `${event._def.ui.backgroundColor}`,
                  backgroundImage: `linear-gradient(
                     to left, 
                     #ffffff 0, 
                     #ffffff 10px, 
                     transparent 50%, 
                     transparent 5%
                  )`,
                  backgroundSize: '100% 100%',
               }}>{event.title}</div>
               </Tooltip>;

            return (<>
               {event.display==='background' ? backgroundEvent : (
                  // Menu de contexto
                  <Menu 
                  width={100} 
                  transitionProps={{ transition: 'slide-right', duration: 150 }}
                  shadow="md">
                     <Menu.Target>{regularEvent}</Menu.Target>
                     <Menu.Dropdown>
                        <Menu.Item onClick={() => {
                           if (isLoggedIn) {handleEventEdit(event.extendedProps.eventId)}
                           else {showNotification("Ação necessária", 'Por favor clique em "Login" e introduza as suas credenciais de acesso para efetuar esta operação', "red");}
                        }}>Editar</Menu.Item>
                        <Menu.Item onClick={() => {
                           if (isLoggedIn) {handleEventDelete(event.extendedProps.eventId)}
                           else {showNotification("Ação necessária", 'Por favor clique em "Login" e introduza as suas credenciais de acesso para efetuar esta operação', "red");}
                        }}>Eliminar</Menu.Item>
                     </Menu.Dropdown>
                  </Menu>
               )}            
            </> );
         }}
         datesSet={handleDatesSet}
         eventDidMount={({ event, el }) => {
            el.oncontextmenu = (e) => { e.preventDefault() }
            el.ondblclick = () =>  { eventDCHandler(event.extendedProps.eventId) }  // Editar ausência com double-click
            
            if (event.extendedProps.type === 'off-day') { // Retirar funcionalidade de ausências (não-férias)
               event.setProp('editable', false);
               event.setProp('durationEditable', false);
            }
         }}
         eventResize={({ event }) => {
            if (event.extendedProps.type == 'vacation') {
               const updatedStart = event.start ? processDate(event.start) : '';                  
               const updatedEnd = event.end ? processDate(event.end,-1) : event.start ? processDate(event.start) : '';     
               handleEventEdit(event.extendedProps.eventId, updatedStart, updatedEnd);
            } else { return; }            
         }}
         eventDrop={({ event }) => {
            let updatedStart;
            let updatedEnd;
            const isOffDay = event.extendedProps.type === 'off-day';
            const hasTimeComponent  = 
               event.start && 
               event.extendedProps.originalEnd &&
               (
                  event.start.toString().includes('T') || 
                  event.extendedProps.originalEnd.toString().includes('T')
               );
            
            if (isOffDay && hasTimeComponent ){
               const endTime = dayjs(event.extendedProps.originalEnd).format('HH:mm');
               updatedStart = `${dayjs(event.start).format('YYYY-MM-DDTHH:mm')}`;
               updatedEnd = `${dayjs(event.end).add(-1).format('YYYY-MM-DD')}T${endTime}`;
            } else {
               updatedStart = event.start ? processDate(event.start) : ''
               updatedEnd = event.end ? processDate(event.end, -1) : event.start ? processDate(event.start) : '';
            }
            handleEventEdit(event.extendedProps.eventId, updatedStart, updatedEnd);
         }}
         dateClick={(info) => { // criar nova ausência em dia vazio
            info.dayEl.addEventListener('dblclick', () => handleDateDoubleClick(info));
         }}
         />

         {/* Modal/Form */}
         <Modal
         opened={showNewAbsenceModal}
         onClose={handleNewAbsenceClose}
         title={currentEvent ? "Editar ausência" : "Nova ausência"}
         centered
         withCloseButton={true}
         className='formModal'
         overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
         style={{ left: "0%", position: "absolute" }}
         >
            <AbsenceModal
            onClose={handleNewAbsenceClose}
            onUpdateAbsences={fetchAndUpdateWorkers}
            currentEvent={currentEvent}
            workers={workers}
            defaultDate={selectedDate}
            />
         </Modal>

         {/* Confirm */}
         <Modal 
         opened={isConfirmEventDelOpen} 
         onClose={() => setIsConfirmEventDelOpen(false)} 
         closeOnClickOutside={false}
         title="Confirmar"              
         style={{
            left: "0%",
            position: "absolute"
         }} >
            <Text ta="center" mt="md">Tem certeza de que deseja eliminar este evento?</Text>
            <Text ta="center" mt="md">Esta operação não pode ser revertida.</Text>
            <Group mt="md" justify='center'>
               <Button onClick={handleConfirm}>Confirmar</Button>
               <Button onClick={() => setIsConfirmEventDelOpen(false)} color="gray">Cancelar</Button>
            </Group>
         </Modal>
      </>
   );
};

export default memo(WorkerCalendar);