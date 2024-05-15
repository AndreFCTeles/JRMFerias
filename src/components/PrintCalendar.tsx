import React, { useState, useEffect, useRef, useCallback } from 'react';
import {  Button, Select, Stack,  Grid, Container, Group, Title } from '@mantine/core';
import { YearPickerInput } from '@mantine/dates';

import FullCalendar from '@fullcalendar/react';
import multiMonthPlugin from '@fullcalendar/multimonth';
import ptLocale from '@fullcalendar/core/locales/pt';

import { Worker, CalendarEvent, HolidayAPIEvent } from '../utils/types';
import fetchWorkers from '../utils/workers/fetchWorkers';
import fetchAbsences from '../utils/absences/fetchAbsences';
import fetchHolidays from '../utils/absences/fetchHolidays';
import logoImage from '../assets/32logo_electrex.png'


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
   const [absenceEvents, setAbsenceEvents] = useState<CalendarEvent[]>([]);
   const [holidayEvents, setHolidayEvents] = useState<CalendarEvent[]>([]);
   const calendarRef = useRef(null);
   const workerOptions = workers.map(worker => ({ value: worker.id, label: worker.title }));

   // EFFECTS
   useEffect(() => {
      const initFetchWorkers = async () => {
         const fetchedWorkers = await fetchWorkers();
         const filteredWorkers = fetchedWorkers.filter(worker => worker.id !== "1");    
         setWorkers(filteredWorkers);
      };
      initFetchWorkers();
   }, []);

   useEffect(() => {
      const fetchEvents = async () => {
         const absences = await fetchAbsences() || [];
         const holidays = await fetchHolidays(selectedYear) || [];         
         const JRMAbsences = absences.filter(event => event.id === "1"); // filtragem da fábrica
         const filteredEvents = [...JRMAbsences, ...absences.filter(event => selectedWorkers.includes(event.id))];

         filteredEvents.forEach(event => event.title = '');
         holidays.forEach((event: HolidayAPIEvent) => event.title = '');
         setAbsenceEvents(filteredEvents);
         setHolidayEvents(holidays);
      };
      fetchEvents();
   }, [selectedYear, selectedWorkers]);   

   useEffect(() => {
      const calendarInstance = calendarRef.current as FullCalendarMethods | null;
      if (calendarInstance !== null) {
         const calendarApi = calendarInstance.getApi();
         calendarApi.gotoDate(`${selectedYear}-01-01`);
      }
   }, [selectedYear]);
   
   // HANDLERS
   const getEventsAsDays = useCallback(() => { 
      //Todo este mumbo-jumbo serve para dividir eventos e não 
      //partir simplesmente a interface durante o print
      const adjustedEvents: CalendarEvent[] = [];
      absenceEvents.forEach(event => {
         const start = new Date(event.start).getTime();
         const end = new Date(event.end).getTime();
         // Calculate the difference in days between the start and end dates
         const diffTime = Math.abs(end - start);
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
         // For events that span multiple days, create a new event for each day
         for (let i = 0; i <= diffDays; i++) { // Adjust loop condition to include the end day
               const newStart = new Date(start + (i * 1000 * 60 * 60 * 24));
               let newEnd = new Date(newStart.getTime() + (1000 * 60 * 60 * 24));
               // For the last day, adjust the end date to be the same as the start date
               if (i === diffDays) {
                  newEnd = new Date(newStart.getTime());
               }
               adjustedEvents.push({
                  ...event,
                  start: newStart.toISOString().split('T')[0],
                  end: newEnd.toISOString().split('T')[0],
                  id: `${event.id}-${i}` // Ensure unique ID for each segmented event
               });
         }
      });
      return adjustedEvents;
   }, [absenceEvents]);
   
   useEffect(() => {
      const adjustedAbsenceEvents = getEventsAsDays();
      setEvents([...adjustedAbsenceEvents, ...holidayEvents]);
   }, [getEventsAsDays, holidayEvents]);

   const isWeekend = (date: Date) => {
      const day = date.getDay();
      console.log(day)
      return day === 0 || day === 6; // Sunday = 0, Saturday = 6
   };

   const handleDatesSet = (dateInfo: DateInfo) => {
      const newYear = dateInfo.start.getFullYear();
      setSelectedYear(newYear);
   };

   const handlePrint = () => {
      setIsPrintMode(true);
      setTimeout(() => { window.print(); }, 500);    
      window.onafterprint = () => setIsPrintMode(false);
   };

   // JSX
   return (
      <>
         {isPrintMode && (
            <Container fluid h={50} py={"1%"}>
               <Group justify="space-between" grow>
                  <Group pl={"sm"} gap={0}>
                     <img src={logoImage} padding-right={0} margin-right={0} alt='' />
                  </Group>
                  <Title order={3} style={{textAlign: "center"}}>Janeiro - Dezembro de {selectedYear}</Title>
                  <Title order={3} style={{textAlign: "center"}}>{selectedWorkerName}</Title>
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
                  height: '99%',
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