//Frameworks
import React, { 
   useState, 
   useEffect, 
   useCallback, 
   useRef,
   useMemo,
   memo 
} from 'react';
import { 
   Tooltip, 
   Notification, 
   Modal,
   Text, 
   Button, 
   Group, 
   Menu 
} from '@mantine/core';
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
import { 
   CalendarView, 
   CalendarEvent, 
   JRMWorkerData, 
   NameDisplay, 
   Hover
} from '../utils/types';
// Utils
import { 
   processDate, 
   isWeekend, 
   resolveWorkerLabel, 
   expandInclusive
} from '../utils/generalUtils';
import fetchHolidays from '../utils/absences/fetchHolidays';
import updateAbsence from '../utils/absences/updateAbsence';
import deleteAbsence from '../utils/absences/deleteAbsence';

// Props
interface WorkerCalendarProps {
   workers: JRMWorkerData[];
   workerEvents: CalendarEvent[];
   isLoggedIn: boolean;
   view: CalendarView; 
   fetchAndUpdateWorkers: () => void;
   triggerOpenModal: boolean;
   resetTrigger: () => void;
   showNotification: (
      title: string, 
      message: string | React.ReactNode, 
      color: string
   ) => void;
   selectedDepartments: string[];
   selectedWorkers: string[];
   nameDisplay: NameDisplay
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
   showNotification,
   selectedDepartments,
   selectedWorkers,
   nameDisplay
}) => {

   // STATES/VARS
   // functionality
   const [error, setError] = useState<string | null>(null);
   const [isConfirmEventDelOpen, setIsConfirmEventDelOpen] = useState(false);   
   const [showNewAbsenceModal, setShowNewAbsenceModal] = useState(false);
   const [selectedDate, setSelectedDate] = useState<Date | null>(null);
   const [currentEvent, setCurrentEvent] = useState<CalendarEvent | null>(null);
   // 'current' states
   const [currentYearInView, setCurrentYearInView] = useState(dayjs().year());
   const [lastMonthInView, setLastMonthInView] = useState(dayjs().month());
   // events
   const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
   const [localEvents, setLocalEvents] = useState<CalendarEvent[]>([]);
   // tooltips
   const [hover, setHover] = useState<Hover>(null);
   const [holidayByDate, setHolidayByDate] = useState<Map<string, string[]>>(new Map());
   const holidayByDateRef = useRef(holidayByDate);
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
         if (currentYearHolidays.length === 0) {
            showNotification(
               "AVISO",
               <>
                  Dados de feriados não puderam ser carregados.
                  <br />Podem ocorrer problemas a criar e editar ausências - por favor tente mais tarde.<br />
                  <hr padding-y={'md'} />
                  Pode verificar o estado da API aqui: <a href="https://openpotato.github.io/uptime/history/open-holidays-api" target="_blank" rel="noopener noreferrer">open-holidays-api/uptime</a>.
                  <br />Ou aqui: <a href="https://openpotato.github.io/uptime/" target="_blank" rel="noopener noreferrer">openpotato.github.io</a>.
               </>,
               "yellow"
            );
         }
         const combinedEvents = [
            ...(workerEvents || []),
            ...(currentYearHolidays || [])
         ];
         setLocalEvents(combinedEvents);
      } catch (error) {
         console.error('Error fetching events:', error);
         setError('Ocorreu um problema ao carregar dados. Por favor tente mais tarde.');
      }
   }, [workerEvents, showNotification]);









   // HANDLERS
   // Inicialização de dados
   const handleDatesSet = useCallback(({ start }: DatesSetArg) => {
      if (calendarRef.current) {
         const calendarApi = calendarRef.current.getApi();
         const currentView = calendarApi.view.type;                  
         setCurrentYearInView(dayjs(start).year());
         if (currentView === 'dayGridMonth') { setLastMonthInView(dayjs(start).month()); }
      }
   }, []); 

   // Associação de nome - id (para comparação com nome no evento)
   const workerById = useMemo(() => {
      const m = new Map<string, JRMWorkerData>();
      for (const w of workers) m.set(w.id, w);
      return m;
   }, [workers]);


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
                  showNotification("Sucesso", "Evento atualizado com sucesso", "green");
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
      if (!selectedEventId) return;
      await handleEventDelete(selectedEventId);
      setIsConfirmEventDelOpen(false);
      setSelectedEventId(null);
   };

   // Filtragem de eventos com base nos checkpoints de WorkerList
   const filterEvents = useCallback(() => {
      return localEvents.filter((event) =>
         event.display === 'background' ||
         selectedDepartments.includes(event.department || '') || 
         selectedWorkers.includes(event.workerId || '')
      );
   }, [localEvents, selectedDepartments, selectedWorkers])

   // Processar dados para uso com FullCalendar
   const getAdjustedEventsForDisplay = useCallback(() => {
      return filterEvents().map(processedEvent => ({
         ...processedEvent,
         id: `${processedEvent.id}-${processedEvent.start}`,
         end: processedEvent.end ? processDate(processedEvent.end, 1) : undefined,
         originalEnd: processedEvent.end,
         backgroundColor: processedEvent.backgroundColor
      }));
   }, [filterEvents]);
   const adjustedEvents = useMemo(() => getAdjustedEventsForDisplay(), [getAdjustedEventsForDisplay]);

   // Construir dados para tooltip
   const buildWorkerEventTooltip = (
      event: any,
      workerById: Map<string, JRMWorkerData>,
      nameDisplay: NameDisplay
   ): string => {
      const wid = event.extendedProps?.workerId as string | undefined;
      const worker = wid ? workerById.get(wid) : undefined;

      const { label, tooltip } = worker
         ? resolveWorkerLabel(worker, nameDisplay)
         : { label: String(event.title ?? ''), tooltip: String(event.title ?? '') };

      const s = event.start ? dayjs(processDate(event.start)).format('D MMMM') : '';
      const e = dayjs(event.extendedProps?.originalEnd ? processDate(event.extendedProps.originalEnd) : s).format('D MMMM');

      return s !== e ? `${label}:\n\nDe ${s} a ${e}` : `${tooltip}: ${s}`;
   }










   // Declarações para atributos do calendário
   const headerToolbar = useMemo(
      () => ({ left: 'prev next', center: 'title', right: '' }), []
   );

   const views = useMemo(() => ({
      dayGridMonth: {
         type: 'dayGridMonth' as const,
         buttonText: 'Monthly',
         showNonCurrentDates: false,
      },
      multiMonthYear: {
         type: 'multiMonthYear' as const,
         duration: { months: 12 },
         buttonText: 'Yearly',
         visibleRange: () => ({
            start: dayjs(`${currentYearInView}-1-1`).toDate(),
            end: dayjs(`${currentYearInView}-12-31`).toDate(),
         }),
         titleFormat: { year: 'numeric' as const },
      },
   }), [currentYearInView]);

   const onDayCellDidMount = useCallback((arg: any) => {
      const key = dayjs(arg.date).format('YYYY-MM-DD');
      const selector = `[data-date="${key}"]`;

      const onEnter = () => {
         const names = holidayByDateRef.current.get(key);
         if (!names || names.length === 0) return; // only show tooltip if day has holidays
         setHover({ kind: 'day', key, selector, label: names.join('\n') });
      };
      const onLeave = () => {
         setHover(h => (h?.kind === 'day' && h.key === key ? null : h));
      };

      arg.el.addEventListener('mouseenter', onEnter);
      arg.el.addEventListener('mouseleave', onLeave);

      // stash cleanup
      (arg as any)._cleanup = () => {
         arg.el.removeEventListener('mouseenter', onEnter);
         arg.el.removeEventListener('mouseleave', onLeave);
      };
   }, []);
   const onDayCellWillUnmount = useCallback((arg: any) => {(arg as any)._cleanup?.();}, []);

   const renderEventContent = useCallback(({ event }: any) => {
      // Formatar worker names para label evento
      const wid = event.extendedProps?.workerId as string | undefined;
      const worker = wid ? workerById.get(wid) : undefined;
      const {label} = worker
         ? resolveWorkerLabel(worker, nameDisplay)
         : { label: event.title as string};
      // Diferenciar tipos de evento
      const backgroundEvent = <div style={{
                                 fontSize:'12px',
                                 overflow: 'hidden',
                                 textOverflow: 'ellipsis'
                              }}>Feriado</div>
      const regularEvent = <div style={event._def.allDay ? { 
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
                           }}>{label}</div>

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
   }, [workerById, nameDisplay, isLoggedIn, handleEventEdit, handleEventDelete, showNotification]);

   const onEventDidMount = useCallback(({ event, el }: any) => {
      el.oncontextmenu = (e: MouseEvent) => { e.preventDefault() }
      el.ondblclick = () =>  { eventDCHandler(event.extendedProps.eventId) }  // Editar ausência com double-click
      
      if (event.extendedProps.type === 'off-day') { // Retirar funcionalidade de ausências (não-férias)
         event.setProp('editable', false);
         event.setProp('durationEditable', false);
      }

      // Marcar elementos com atributo único para serem targets de Tooltips
      const segId = event._instance?.instanceId ?? `${event.id}-${event.startStr ?? ''}`;
      el.setAttribute('data-evk', String(segId));
   }, [eventDCHandler]);

   const onEventResize = useCallback(({ event }: any) => {
      if (event.extendedProps.type == 'vacation') return;
      const updatedStart = event.start ? processDate(event.start) : '';
      const updatedEnd = event.end ? processDate(event.end,-1) : event.start ? processDate(event.start) : '';     
      handleEventEdit(event.extendedProps.eventId, updatedStart, updatedEnd);
   }, [handleEventEdit]);

   const onEventDrop = useCallback(({ event }: any) => {
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
   }, [handleEventEdit]);

   const onEventMouseEnter = useCallback((arg: any) => {
      if (arg.event.display === 'background') return; // holiday uses day cell tooltip
      const segId = arg.event._instance?.instanceId ?? `${arg.event.id}-${arg.event.startStr ?? ''}`;
      const selector = `[data-evk="${segId}"]`;
      const label = buildWorkerEventTooltip(arg.event, workerById, nameDisplay);
      setHover({ kind: 'event', key: String(segId), selector, label });
   }, [workerById, nameDisplay]); // setHover is stable

   const onEventMouseLeave = useCallback((arg: any) => {
      const segId = arg.event._instance?.instanceId ?? `${arg.event.id}-${arg.event.startStr ?? ''}`;
      setHover(h => (h?.kind === 'event' && h.key === String(segId) ? null : h));
   }, []);

   const onDateClick = useCallback((info: any) => {
      info.dayEl.addEventListener('dblclick', () => handleDateDoubleClick(info));
   }, [handleDateDoubleClick]);











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

   // Distinção de tipos de eventos para Tooltips
   useEffect(() => {
      const map = new Map<string, string[]>();

      for (const ev of adjustedEvents) {
         if (ev.display !== 'background') continue; // only holidays
         const start = ev.start!;
         const endIncl = (ev as any).originalEnd ?? ev.end ?? ev.start!;

         for (const key of expandInclusive(start, endIncl)) {
            const arr = map.get(key) ?? [];
            if (!arr.includes(ev.title as string)) arr.push(ev.title as string);
            map.set(key, arr);
         }
      }
      setHolidayByDate(map);
   }, [adjustedEvents, setHolidayByDate]);
   useEffect(() => { holidayByDateRef.current = holidayByDate; }, [holidayByDate]);

   // sanity
   useEffect(()=>{ console.log("WorkerCalendar rendered") }, [])















   // JSX
   return (
      <>
         {/* Notification System */}
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
         headerToolbar={headerToolbar}
         views={views}
         titleFormat={{ month: 'long', year: 'numeric' }}
         editable={isLoggedIn} 
         events={adjustedEvents}
         dayCellClassNames={(arg) => (isWeekend(arg.date) ? "weekend" : "")}
         dayCellDidMount={onDayCellDidMount}
         dayCellWillUnmount={onDayCellWillUnmount}
         eventContent={renderEventContent}
         datesSet={handleDatesSet}
         eventDidMount={onEventDidMount}
         eventResize={onEventResize}
         eventDrop={onEventDrop}
         eventMouseEnter={onEventMouseEnter}
         eventMouseLeave={onEventMouseLeave}
         dateClick={onDateClick} // criar nova ausência em dia vazio
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

         {/* Tooltip System */}
         {hover && (
            <Tooltip
            multiline
            opened={!!hover}
            label={hover?.label ?? ''}
            target={hover?.selector ?? ''}
            withinPortal
            />
         )}
      </>
   );
};

export default memo(WorkerCalendar);