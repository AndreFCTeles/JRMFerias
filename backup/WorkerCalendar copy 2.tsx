import React, { useState, useEffect } from 'react';
import { ScrollArea, Tooltip, Notification } from '@mantine/core';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import ptLocale from '@fullcalendar/core/locales/pt';
import dayjs from 'dayjs';

interface OffDay {
   start: string;
   end?: string;
}

interface Vacation {
   start: string;
   end: string;
}

interface EventText{
   language: string;
   text: string;
}

interface Worker {
   id: string;
   title: string;
   vacations: Vacation[];
   offDays: OffDay[];
   color: string;
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
   const [currentYearInView, setCurrentYearInView] = useState(new Date().getFullYear());
   const [events, setEvents] = useState<Event[]>([]);
   const [error, setError] = useState<string | null>(null);
   
   const fetchEvents = async (year: number) => {
      const validFrom = `${year}-01-01`;
      const validTo = `${year}-12-31`;

      const holidaysPromise = fetch(`https://openholidaysapi.org/PublicHolidays?countryIsoCode=PT&languageIsoCode=PT&validFrom=${validFrom}&validTo=${validTo}&subdivisionCode=PT-AV-AV`)
         .then(response => response.json())
         .then(data => data.map((holiday: Event) => ({
            title: holiday.name?.find((n: { language: string; }) => n.language === 'PT')?.text || 'Holiday',
            start: holiday.startDate,
            end: holiday.endDate || holiday.startDate,
            color: '#32a852',
         })));

      const workerEventsPromise = fetch('/api/getferias', { cache: 'no-store' })
         .then(response => response.json())
         .then(({ workers }: { workers: Worker[] }) => workers.flatMap((worker: Worker) => [
            ...worker.vacations.map(vacation => ({
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
               end: offDay.end || offDay.start,
               color: worker.color,
            })),
         ]));

      Promise.all([holidaysPromise, workerEventsPromise])
         .then(([holidayEvents, workerEvents]) => { setEvents([...holidayEvents, ...workerEvents]); })
         .catch(error => console.error("Erro ao buscar eventos:", error));
   };

   useEffect(() => { fetchEvents(currentYearInView); }, [currentYearInView]);


   return (
      <ScrollArea style={{ height: "calc(100% - 50px) " }} type='auto'>
         <FullCalendar
            locale={ptLocale}
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            events={events}
            eventDidMount={({ event, el }) => {
               const formattedStartDate = dayjs(event.startStr).format('DD-MM-YYYY');
               const formattedEndDate = event.endStr ? dayjs(event.endStr).format('DD-MM-YYYY') : formattedStartDate;

               // Adding a native HTML tooltip
               const tooltipContent = `${event.title}: De ${formattedStartDate} a ${formattedEndDate}`;
               el.setAttribute('title', tooltipContent);
            }}
            datesSet={({ start }) => {
               const yearInView = dayjs(start).year();
               setCurrentYearInView(yearInView);
            }}
         />
      </ScrollArea>
   );
};

export default MyCalendar;