import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ScrollArea, Tooltip, Notification, Modal, Text, Button, Group  } from '@mantine/core';
import { useContextMenu } from 'mantine-contextmenu';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import multiMonthPlugin from '@fullcalendar/multimonth';
import interactionPlugin from '@fullcalendar/interaction';
import ptLocale from '@fullcalendar/core/locales/pt';
import dayjs from 'dayjs';
import 'dayjs/locale/pt';
dayjs.locale('pt');

import { CalendarEvent } from '../utils/types';
import { DatesSetArg } from '@fullcalendar/core/index.js';
import processDate from '../utils/processDate';
import fetchAbsences from '../utils/absences/fetchAbsences';
import fetchHolidays from '../utils/absences/fetchHolidays';
import updateAbsence from '../utils/absences/updateAbsence';

interface WorkerCalendarProps {
   refreshTrigger: boolean;
   onEventEdit: (eventId: string) => void;
   onEventDelete: (eventID: string) => void;
   showNotification: (title: string, message: string, color: string) => void;
   isLoggedIn: boolean;
   view: 'dayGridMonth' | 'multiMonthYear';
}





// Component
const WorkerCalendar: React.FC<WorkerCalendarProps> = ({ refreshTrigger, onEventEdit, onEventDelete, showNotification, isLoggedIn, view }) => {

   // STATES
   // functionality
   const {showContextMenu} = useContextMenu();
   const [error, setError] = useState<string | null>(null);
   const [isConfirmEventDelOpen, setIsConfirmEventDelOpen] = useState(false);   
   // 'current' states
   const [currentYearInView, setCurrentYearInView] = useState(new Date().getFullYear());
   const [lastMonthInView, setLastMonthInView] = useState(new Date().getMonth());
   // events
   const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
   const [localEvents, setLocalEvents] = useState<CalendarEvent[]>([]);
   // trackers for default values
   const calendarRef = useRef<FullCalendar>(null);





   // DATA FETCHING   
   const fetchEvents = useCallback(async (year: number) => {
      setError(null);
      console.log('Fetching events for current year:', year);
      try {
         const [absences, currentYearHolidays] = await Promise.all([
            fetchAbsences(),
            fetchHolidays(year)
         ]);

         const combinedEvents = [
            ...(absences || []),
            ...(currentYearHolidays || [])
         ];
         setLocalEvents(combinedEvents);
      } catch (error) {
         console.error('Error fetching events:', error);
         setError('Ocorreu um problema ao carregar dados. Por favor tente mais tarde.');
      }
   }, []);

   const getAdjustedEventsForDisplay = useCallback(() => {
      return localEvents.map(processedEvent => ({
         ...processedEvent,
         id: `${processedEvent.id}-${processedEvent.start}`,
         end: processedEvent.end ? processDate(processedEvent.end, 1) : undefined,
         originalEnd: processedEvent.end,
      }));
   }, [localEvents]);





   // HANDLERS / utils
   const contextMenuHandler = useCallback((eventId: string) => showContextMenu([
      {
         key: 'edit',
         title: 'Editar',
         onClick: () => {
            if (isLoggedIn) { onEventEdit(eventId); } 
            else {
               showNotification("Requer Login", 'Por favor clique em "Login" e introduza as suas credenciais de acesso para efetuar esta operação', "red");
            }
         }
      },
      {
         key: 'del',
         title: 'Eliminar',
         onClick: () => {
            if (isLoggedIn) {
               setSelectedEventId(eventId);
               setIsConfirmEventDelOpen(true);
            } else {
               showNotification("Requer Login", 'Por favor clique em "Login" e introduza as suas credenciais de acesso para efetuar esta operação', "red");
            }
         }
      }
   ]), [showNotification, isLoggedIn, setSelectedEventId, onEventEdit, setIsConfirmEventDelOpen, showContextMenu]);
   
   const handleDatesSet = useCallback(({ start }: DatesSetArg) => {
      if (calendarRef.current) {
         const calendarApi = calendarRef.current.getApi();
         const currentView = calendarApi.view.type;
         
         // Update year in view always
         setCurrentYearInView(start.getFullYear());

         // Update last month in view only if the current view is 'dayGridMonth'
         if (currentView === 'dayGridMonth') {
            setLastMonthInView(start.getMonth());
         }
      }
   }, []);

   const eventDCHandler = useCallback((editEvent: string) => {
      if (isLoggedIn) { 
         onEventEdit(editEvent); 
      } else {
         showNotification("Ação necessária", 'Por favor clique em "Login" e introduza as suas credenciais de acesso para efetuar esta operação', "red");
      }
   }, [isLoggedIn, onEventEdit, showNotification]);

   const handleConfirm = async () => {
      if (selectedEventId) {
         onEventDelete(selectedEventId);
         setIsConfirmEventDelOpen(false);
         setSelectedEventId(null);
      }
   };

   const isWeekend = (date: Date) => {
      const day = date.getDay();
      return day === 0 || day === 6; // Sunday = 0, Saturday = 6
   };


   // EFFECTS
   useEffect(() => { fetchEvents(currentYearInView); }, [currentYearInView, refreshTrigger, fetchEvents]);

   useEffect(() => {
      requestAnimationFrame(() => {
         console.log('requestAnimationFrame useEffect')
         if (calendarRef.current) {
            const calendarApi = calendarRef.current.getApi();
            calendarApi.changeView(view);
            if (view === 'dayGridMonth') {
               console.log('requestAnimationFrame currently changing view:', currentYearInView);
               const lastMonthDate = new Date(currentYearInView, lastMonthInView, 1);
               console.log(`requestAnimationFrame Navigating to last viewed month: `, lastMonthDate);
               calendarApi.gotoDate(lastMonthDate); // Navigate to the last viewed month in dayGridMonth view
            } else if (view === 'multiMonthYear') {
               console.log('requestAnimationFrame currently changing view:', currentYearInView);
               calendarApi.gotoDate(new Date(currentYearInView, 0, 1)); // Navigate to January 1st of the current year in view
            }
         }
      });
   }, [view, currentYearInView, lastMonthInView]);





   // JSX
   return (
      <>
         {error && ( <Notification color="red" onClose={() => setError(null)}> {error} </Notification> )}         
         <ScrollArea style={{ height: 'calc(100% - 50px)' }} type="auto">
            <FullCalendar
            ref={calendarRef}
            locale={ptLocale}
            firstDay={0}
            height="83vh"
            contentHeight={"100%"}
            plugins={[dayGridPlugin, multiMonthPlugin, interactionPlugin]}
            initialView={view}
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
            editable={isLoggedIn && view === 'dayGridMonth'}
            events={getAdjustedEventsForDisplay()}
            dayCellClassNames={(arg) => (isWeekend(arg.date) ? "weekend" : "")}
            eventContent={({ event }) => {
               const formattedStartDate = event.start ? dayjs(processDate(event.start)).format("D MMMM") : '';
               const formattedEndDate = dayjs(event.extendedProps.originalEnd ? processDate(event.extendedProps.originalEnd) : formattedStartDate).format("D MMMM");
               const tooltipContent = formattedStartDate !== formattedEndDate
                                    ? `${event.title}:\n De ${formattedStartDate} a ${formattedEndDate}`
                                    : `${event.title}: ${formattedStartDate}`;
               return (
                  <Tooltip 
                  multiline
                  w={200}
                  withArrow
                  arrowOffset={50} 
                  arrowSize={8}
                  label={tooltipContent}
                  transitionProps={{ transition: 'slide-down', duration: 300 }}
                  >
                     <div onContextMenu={contextMenuHandler(event.extendedProps.eventId)}>{
                        view === 'dayGridMonth'
                           ? event.title
                           : event.display==='background' 
                              ? 'Feriado'
                              : event.title
                     }</div>
                  </Tooltip>
               );
            }}
            datesSet={handleDatesSet}
            eventDidMount={({ event, el }) => {
               el.oncontextmenu = (e) => { e.preventDefault() }
               el.ondblclick = () => eventDCHandler(event.extendedProps.eventId);
            }}
            eventResize={({ event }) => {
               if(isLoggedIn){
                  const updatedData = {
                     start: event.start ? processDate(event.start) : '',
                     end: event.end ? processDate(event.end) : event.start ? processDate(event.start) : '',
                  };
                  updateAbsence(event.extendedProps.eventId, updatedData)
                     .then(() => { console.log("Event updated successfully"); })
                     .catch(error => { console.error("Error updating event:", error); });
               } else return;
            }}
            eventDrop={({ event }) => {
               if(isLoggedIn){
                  const updatedData = {
                     start: event.start ? processDate(event.start) : '',
                     end: event.end ? processDate(event.end, -1) : event.start ? processDate(event.start) : ''
                  };
                  updateAbsence(event.extendedProps.eventId, updatedData)
                     .then(() => { console.log("Event updated successfully"); })
                     .catch(error => { console.error("Error updating event:", error); });
               } else return;
            }}
            />
         </ScrollArea>

         <Modal 
         opened={isConfirmEventDelOpen} 
         onClose={() => setIsConfirmEventDelOpen(false)} 
         title="Confirmar"              
         style={{
            left: "0%",
            position: "absolute"
         }} >
            <Text ta="center" mt="md">Tem certeza de que deseja eliminar colaborador?</Text>
            <Text ta="center" mt="md">Esta operação não pode ser revertida.</Text>
            <Group mt="md" justify='center'>
               <Button onClick={handleConfirm}>Confirmar</Button>
               <Button onClick={() => setIsConfirmEventDelOpen(false)} color="gray">Cancelar</Button>
            </Group>
         </Modal>
      </>
   );
};

export default WorkerCalendar;