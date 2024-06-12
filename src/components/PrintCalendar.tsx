import React, { useState, useEffect, useRef, useMemo } from 'react';
import {  Button, Select, Stack,  Grid, Container, Group, Title, Image, Notification } from '@mantine/core';
import { YearPickerInput } from '@mantine/dates';

import FullCalendar from '@fullcalendar/react';
import multiMonthPlugin from '@fullcalendar/multimonth';
import ptLocale from '@fullcalendar/core/locales/pt';

import { Worker, CalendarEvent, ProcessedHolidayEvent } from '../utils/types';
import fetchWorkers from '../utils/workers/fetchWorkers';
import fetchAbsences from '../utils/absences/fetchAbsences';
import fetchHolidays from '../utils/absences/fetchHolidays';
import logoImage from '../assets/32logo_electrex.png';


// INTERFACES
interface PrintCalendarProps {    
   isPrintMode: boolean;
   setIsPrintMode: (isPrintMode: boolean) => void; 
}
interface FullCalendarMethods { getApi: () => { gotoDate: (dateStr: string) => void; }; }
interface DateInfo { start: Date; }





// COMPONENT
const PrintCalendar: React.FC<PrintCalendarProps> = ({isPrintMode, setIsPrintMode}) => {
   // STATES
   const [workers, setWorkers] = useState<Worker[]>([]);
   const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
   const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
   const [selectedWorkerName, setSelectedWorkerName] = useState<string>('');
   const [events, setEvents] = useState<CalendarEvent[]>([]);
   const [error, setError] = useState<string | null>(null);
   const calendarRef = useRef(null);
   const workerOptions = useMemo(() => workers.map(worker => ({ value: worker.id, label: worker.title })), [workers]);


   // UTILS
   const isWeekend = (date: Date) => {
      const day = date.getDay();
      return day === 0 || day === 6; // Sunday = 0, Saturday = 6
   };

   const getFirstAndLastName = (fullName: string): string => {
      const nameParts = fullName.split(' ');
      if (nameParts.length < 2) { return fullName; } // If there is only one part, return the full name
      const firstName = nameParts[0];
      const lastName = nameParts[nameParts.length - 1];
      return `${firstName} ${lastName}`;
   };


   // HANDLERS
   const handleDatesSet = (dateInfo: DateInfo) => {
      const newYear = dateInfo.start.getFullYear();
      setSelectedYear(newYear);
   };

   const handlePrint = () => {
      setIsPrintMode(true);
      setTimeout(() => { window.print(); }, 500);    
      window.onafterprint = () => setIsPrintMode(false);
   };





   // EFFECTS
   useEffect(() => {
      const initFetchWorkers = async () => {
         try {
            const fetchedWorkers = await fetchWorkers();
            const filteredWorkers = fetchedWorkers.filter(worker => worker.id !== "1");
            setWorkers(filteredWorkers);
         } catch (error) {
            console.error("Error fetching workers:", error);
            setError('Failed to fetch workers.');
         }
      };
      initFetchWorkers();
   }, []);

   useEffect(() => {
      console.log(' ');
      console.log('PrintCalendar');
      const fetchAndProcessEvents = async () => {
         try {
            const [absences, holidays] = await Promise.all([
               fetchAbsences() || [],
               fetchHolidays(selectedYear) || []
            ]);            

            const JRMAbsences = absences.filter(event => event.id === "1");
            const filteredAbsences = [...JRMAbsences, ...absences.filter(absEvent => selectedWorkers.includes(absEvent.id))];

            // Clear titles for absence and holiday events
            filteredAbsences.forEach(absEvent => absEvent.title = '');
            holidays.forEach((absEvent: ProcessedHolidayEvent) => absEvent.title = '');

            const adjustedEvents: CalendarEvent[] = [];
            filteredAbsences.forEach(absEvent => {
               const start = new Date(absEvent.start).getTime();
               const end = new Date(absEvent.end).getTime();

               // Calculate the difference in days between the start and end dates
               const diffTime = Math.abs(end - start);
               const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

               // For events that span multiple days, create a new event for each day
               if (diffDays > 0) {
                  for (let i = 0; i <= diffDays; i++) {
                     const newStart = new Date(start + (i * 1000 * 60 * 60 * 24));
                     adjustedEvents.push({
                        ...absEvent,
                        start: newStart.toISOString().split('T')[0],
                        end: newStart.toISOString().split('T')[0],
                        id: `${absEvent.eventId}-${i}`,
                        display: 'background',
                        allDay: true
                     });
                  }
               } else {
                  adjustedEvents.push({
                     ...absEvent,
                     id: `${absEvent.eventId}`,
                     display: 'background',
                     allDay: true
                  });
               }
            });
            console.log("adjustedEvents: ", adjustedEvents)

            const allEvents = [...adjustedEvents, ...holidays];
            console.log("allEvents: ", allEvents);

            setEvents(allEvents);
         } catch (error) {
            console.error("Error fetching events:", error);
            setError('Failed to fetch events.');
         }
      };

      fetchAndProcessEvents();
   }, [selectedYear, selectedWorkers]);

   useEffect(() => {
      const calendarInstance = calendarRef.current as FullCalendarMethods | null;
      if (calendarInstance !== null) {
         const calendarApi = calendarInstance.getApi();
         calendarApi.gotoDate(`${selectedYear}-01-01`);
      }
   }, [selectedYear]);





   // JSX
   return (
      <>
         {error && (
            <Notification color="red" onClose={() => setError(null)}>
               {error}
            </Notification>
         )}
         {isPrintMode && (
            <Container fluid h={50} py={"1%"} mt={"1%"}>
               <Group justify="space-between" grow>
                  <Group pl={"sm"} gap={0}>
                     <Image src={logoImage} pr={0} mr={0} alt='' />
                  </Group>
                  <Title order={3} style={{textAlign: "center"}}>Janeiro - Dezembro de {selectedYear}</Title>
                  <Title order={3} style={{textAlign: "center"}}>{getFirstAndLastName(selectedWorkerName)}</Title>
               </Group>               
            </Container>
         )}
         <Grid>
            {!isPrintMode && (
               <Grid.Col span={isPrintMode ? 0 : 2}>
                  <Stack pt={"5%"}>               
                     <YearPickerInput
                     label="Data a imprimir:"
                     placeholder="data"
                     value={new Date(selectedYear, 0)}
                     onChange={(date) => setSelectedYear(date ? date.getFullYear() : new Date().getFullYear())}
                     clearable
                     />
                     <Select
                     label="Selecionar Colaborador"
                     placeholder="Nome"
                     data={workerOptions}
                     value={selectedWorkers[0] || ''}
                     onChange={(value) => {
                        setSelectedWorkers(value ? [value] : [])
                        setSelectedWorkerName(workers.find(worker => worker.id === value)?.title || '');
                     }}
                     searchable
                     clearable
                     />               
                     <Button onClick={handlePrint}>Imprimir Calendário</Button>
                  </Stack>
               </Grid.Col>
            )}

            <Grid.Col 
            span={isPrintMode ? 12 : 10}   
            className='print-calendar-layout'          
            style={isPrintMode 
               ? { 
                  padding: "1%", 
                  position:"absolute",
                  display: 'block',
                  margin: 'auto',
                  height: '100%',
                  width: '98%',
                  breakAfter: 'always',
                  msOverflowStyle: 'none',
                  scrollbarWidth: 'none',
                  overflow: 'hidden'
               } 
               : { padding: "2%"}
            }>
               <FullCalendar
               ref={calendarRef}
               locale={ptLocale}
               firstDay={0}
               plugins={[multiMonthPlugin]}
               initialView='multiMonthYear'
               views={{
                  multiMonth: {
                     type: 'dayGridMonth',
                     duration: { months: 12 },
                     buttonText: '12 months',
                  },
               }}
               headerToolbar={
                  isPrintMode ?
                  false :
                  {
                     start: isPrintMode ? 'myCustomText' : 'prev next',
                     center: 'title',
                     end: ''
                  } 
               }
               datesSet={(dateInfo) => { handleDatesSet(dateInfo); }}
               events={events}              
               dayCellClassNames={(arg) => (isWeekend(arg.date) ? "weekend" : "")} 
               height={'auto'}
               eventDisplay={isPrintMode ? 'background' : 'background'}
               handleWindowResize={true}
               windowResizeDelay={0}
               aspectRatio={4}
               expandRows={false}
               />
            </Grid.Col>
         </Grid>
      </>
   );
};

export default PrintCalendar;