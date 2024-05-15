import React, { useState, useEffect, useCallback } from 'react';
import { ScrollArea, Tooltip, Notification, Modal, Text, Button, Group } from '@mantine/core';
import { useContextMenu } from 'mantine-contextmenu';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction'; // Added interactionPlugin for potential user interaction
import ptLocale from '@fullcalendar/core/locales/pt';
import dayjs from 'dayjs';
import 'dayjs/locale/pt';
dayjs.locale('pt');

import { CalendarEvent } from '../utils/types';
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
}

// Component
const WorkerCalendar: React.FC<WorkerCalendarProps> = ({ refreshTrigger, onEventEdit, onEventDelete, showNotification, isLoggedIn }) => {

   // STATES
   const {showContextMenu} = useContextMenu();
   const [error, setError] = useState<string | null>(null);
   const [isConfirmEventDelOpen, setIsConfirmEventDelOpen] = useState(false);

   const [currentYearInView, setCurrentYearInView] = useState(new Date().getFullYear());
   const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
   const [localEvents, setLocalEvents] = useState<CalendarEvent[]>([]);

   // EFFECTS
   useEffect(() => {
      const fetchEvents = async () => {
         setError(null);
         try {
            const absences = await fetchAbsences();
            const holidays = await fetchHolidays(currentYearInView);
            setLocalEvents([...(absences || []), ...holidays]);
         } catch (error) {
            console.error('Error fetching events:', error);
            setError('Ocorreu um problema ao carregar dados. Por favor tente mais tarde.');
         }
      };
      setLocalEvents([]);
      fetchEvents();
   }, [currentYearInView, refreshTrigger]);

   // HANDLERS
   const getAdjustedEventsForDisplay = useCallback(() => {
      const processedEvents = localEvents.map(event => ({
         ...event,
         end: event.end ? processDate(event.end, 1) : undefined,
         originalEnd: event.end,
      }));
      console.log("processedEvents")
      console.log(processedEvents)
      return processedEvents;
   }, [localEvents]);

   const isWeekend = (date: Date) => {
      const day = date.getDay();
      return day === 0 || day === 6; // Sunday = 0, Saturday = 6
   };

   const contextMenuHandler = useCallback((eventId:string) => showContextMenu([ 
      isLoggedIn ? {                        
         key: 'edit',
         title: 'Editar',
         onClick: () => onEventEdit(eventId)
      } : {
         key: 'editLoginReminder',
         title: 'Editar',
         onClick: () => showNotification(
            "Requer Login", 
            'Por favor clique em "Login" e introduza as suas credenciais de acesso para efetuar esta operação', 
            "red"
         )
      },                    
      isLoggedIn ? {
         key: 'del',
         title: 'Eliminar',
         onClick: () => {
         setSelectedEventId(eventId);
         setIsConfirmEventDelOpen(true);
         }
      } : {
         key: 'delLoginReminder',
         title: 'Eliminar',
         onClick: () => showNotification(
            "Requer Login", 
            'Por favor clique em "Login" e introduza as suas credenciais de acesso para efetuar esta operação', 
            "red"
         )
      }       
   ]), [showNotification, isLoggedIn, setSelectedEventId, onEventEdit, setIsConfirmEventDelOpen, showContextMenu]);

   const eventDCHandler = (event:string) => {
      if (isLoggedIn) { onEventEdit(event); } 
      else { showNotification("Ação necessária", 'Por favor clique em "Login" e introduza as suas credenciais de acesso para efetuar esta operação', "red");}
   };
   const handleConfirm = async () => {
      if (selectedEventId) {
         onEventDelete(selectedEventId);
         setIsConfirmEventDelOpen(false);
         setSelectedEventId(null);
      }
   };

   // JSX
   return (
      <>
         {error && ( <Notification color="red" onClose={() => setError(null)}> {error} </Notification> )}
         <ScrollArea style={{ height: 'calc(100% - 50px)' }} type="auto">
            <FullCalendar
               key={isLoggedIn ? "logged-in" : "logged-out"}
               locale={ptLocale}
               firstDay={0}
               plugins={[dayGridPlugin, interactionPlugin]}
               initialView="dayGridMonth"
               height="83vh"
               contentHeight={"100%"}
               headerToolbar={{ start:'prev next', center: 'title', end: '' }}
               titleFormat={{ month: 'long', year: 'numeric' }}
               editable={true}
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
                        <div onContextMenu={contextMenuHandler(event.extendedProps.eventId)}>{event.title}</div>
                     </Tooltip>
                  );
               }}
               datesSet={({ start }) => {
                  const yearInView = start.getFullYear();
                  if (yearInView !== currentYearInView) { setCurrentYearInView(yearInView); }
               }}
               eventDidMount={({ event, el }) => {
                  el.oncontextmenu = (e) => { e.preventDefault() }
                  el.ondblclick = () => eventDCHandler(event.extendedProps.eventId);
               }}
               eventResize={ 
                  ({ event }) => {
                     if(isLoggedIn){
                        const updatedData = {
                           start: event.start ? processDate(event.start) : '',
                           end: event.end ? processDate(event.end) : event.start ? processDate(event.start) : '',
                        };
                        updateAbsence(event.extendedProps.eventId, updatedData)
                           .then(() => { console.log("Event updated successfully"); })
                           .catch(error => { console.error("Error updating event:", error); });
                     } else return;
                  }
               }
               eventDrop={
                  ({ event }) => {
                     if(isLoggedIn){
                        const updatedData = {
                           start: event.start ? processDate(event.start) : '',
                           end: event.end ? processDate(event.end, -1) : event.start ? processDate(event.start) : ''
                        };
                        updateAbsence(event.extendedProps.eventId, updatedData)
                           .then(() => { console.log("Event updated successfully"); })
                           .catch(error => { console.error("Error updating event:", error); });
                     } else return;
                  }
               }
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