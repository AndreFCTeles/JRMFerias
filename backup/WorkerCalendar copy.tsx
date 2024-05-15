import React, { useState, useEffect, useCallback } from 'react';
import { ScrollArea } from '@mantine/core';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import ptLocale from '@fullcalendar/core/locales/pt';

interface Worker {
   id: string;
   title: string;
   vacations: Vacation[];
   offDays: OffDay[];
   color: string;
}

interface Vacation {
   start: string;
   end: string;
}

interface EventText{
   language: string;
   text: string;
}

interface OffDay {
   start: string;
   end?: string;
}
interface Event {
   id?: string;
   title: string;
   name?: EventText[];
   startDate: string;
   endDate?: string;
   color: string;
}

const MyCalendar: React.FC = () => {
   const [events, setEvents] = useState<Event[]>([]);
   const [fetchedYears, setFetchedYears] = useState<{ [key: number]: boolean }>({});

   const COUNTRY_CODE = 'PT';
   const LANGUAGE_CODE = 'PT';
   const SUBDIVISION_CODE = 'PT-AV-AV';

   const fetchHolidays = useCallback(async (year: number) => {
      if (fetchedYears[year]) return; // se o ano já tiver sido fetched, skip

      const validFrom = `${year}-01-01`;
      const validTo = `${year}-12-31`
      try {
         const response = await fetch(`https://openholidaysapi.org/PublicHolidays?countryIsoCode=${COUNTRY_CODE}&languageIsoCode=${LANGUAGE_CODE}&validFrom=${validFrom}&validTo=${validTo}&subdivisionCode=${SUBDIVISION_CODE}`);
         if (!response.ok) throw new Error('Falha ao buscar feriados');
         const data = await response.json();
         console.log(data);
         const holidayEvents: Event[] = data.map((holiday: Event, index: number) => {
            const holidayNamePT = holiday.name?.find(n => n.language === 'PT')?.text || 'Holiday';
            return {
               id: `holiday-${year}-${index}`,
               title: holidayNamePT,
               start: holiday.startDate,
               end: holiday.endDate || holiday.startDate,
               color: '#32a852'
            }
         });

         console.log(holidayEvents);
         setEvents(prevEvents => [...prevEvents, ...holidayEvents]);
         setFetchedYears(prevYears => ({ ...prevYears, [year]: true })); // Mark the year as fetched
      } catch (error) { console.error('Erro ao buscar feriados:',  error); }
   }, [fetchedYears]);

   const fetchWorkerOffDays = useCallback(async () => {
      try {
         const response = await fetch('/api/getferias');
         if (!response.ok) throw new Error('Falha ao buscar ausências');
         const { workers } = await response.json();

         const workerEvents: Event[] = workers.flatMap((worker: Worker) => 
         [...worker.vacations.map(vacation => ({
            id: worker.id,
            title: `${worker.title} (Férias)`,
            start: vacation.start,
            end: vacation.end,
            color: worker.color,
         })), 
         ...worker.offDays.map(offDay => ({
            id: worker.id,
            title: `${worker.title} (Ausência)`,
            start: offDay.start,
            end: offDay.end || offDay.start, // Handle the case where end might not be provided for off-days
            color: worker.color,
         }))]
         );

         setEvents(prev => [...prev, ...workerEvents]);
      } catch (error) {
         console.error('Erro ao buscar ausências de colaborador:', error);
      }
   }, []);

   useEffect(() => {
      const currentYear = new Date().getFullYear();
      fetchHolidays(currentYear);
      fetchWorkerOffDays();      
   }, [fetchHolidays, fetchWorkerOffDays]);

   return (
      <ScrollArea style={{ height: "100%" }} type='auto'>
         <FullCalendar
            locale={ptLocale}
            datesSet={(dateInfo) => {
               const yearInView = dateInfo.start.getFullYear();
               if (!fetchedYears[yearInView]) {
                  fetchHolidays(yearInView);
                  fetchWorkerOffDays();
               }
            }}
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            events={events}
         />
      </ScrollArea>
   );
};

export default MyCalendar;