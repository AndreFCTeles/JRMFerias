import React, { useState, useEffect } from 'react';
import { ScrollArea, Tooltip, Notification } from '@mantine/core';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import ptLocale from '@fullcalendar/core/locales/pt';
import dayjs from 'dayjs';

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

interface EventText {
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

const PUBLIC_HOLIDAYS_URL = `https://openholidaysapi.org/PublicHolidays`;

const MyCalendar: React.FC = () => {
   const [holidayEvents, setHolidayEvents] = useState<Event[]>([]);
   const [workerEvents, setWorkerEvents] = useState<Event[]>([]);
   const [error, setError] = useState<string | null>(null);
   const [currentYearInView, setCurrentYearInView] = useState(new Date().getFullYear());

   useEffect(() => {
      

      fetchWorkerEvents();
   }, []); // Empty dependency array to run only once on mount

   useEffect(() => {
      const fetchHolidayEvents = async (year: number) => {
         const validFrom = `${year}-01-01`;
         const validTo = `${year}-12-31`;
         try {
            const holidaysResponse = await fetch(`${PUBLIC_HOLIDAYS_URL}?countryIsoCode=PT&languageIsoCode=PT&validFrom=${validFrom}&validTo=${validTo}&subdivisionCode=PT-AV-AV`);
            const holidaysData = await holidaysResponse.json();
            const newHolidayEvents = holidaysData.map((holiday: Event) => ({
               title: holiday.name?.find((n: EventText) => n.language === 'PT')?.text || 'Holiday',
               start: holiday.startDate,
               end: holiday.endDate || holiday.startDate,
               color: '#32a852',
            }));

            setHolidayEvents(newHolidayEvents); // Replace old holiday events with new ones
         } catch (error) {
            console.error("Error fetching holiday events:", error);
            setError("Failed to load holiday events. Please try again later.");
         }
      };

      fetchHolidayEvents(currentYearInView);
   }, [currentYearInView]);

   // Combine holiday and worker events for the FullCalendar component
   const combinedEvents = [...holidayEvents, ...workerEvents];

   return (
      <>
         {error && (
         <Notification color="red" onClose={() => setError(null)}>
            {error}
         </Notification>
         )}
         <ScrollArea style={{ height: "calc(100% - 50px)" }} type="auto">
         <FullCalendar
            locale={ptLocale}
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            events={combinedEvents}
            eventContent={({ event }) => {
               const formattedStartDate = dayjs(event.startStr).format('DD-MM-YYYY');
               const formattedEndDate = event.endStr ? dayjs(event.endStr).format('DD-MM-YYYY') : formattedStartDate;
               const tooltipContent = `${event.title}: De ${formattedStartDate} a ${formattedEndDate}`;

               return (
                  <Tooltip label={tooltipContent}>
                     <div>{event.title}</div>
                  </Tooltip>
               );
            }}
            datesSet={({ start }) => {
               const yearInView = dayjs(start).year();
               if (yearInView !== currentYearInView) { setCurrentYearInView(yearInView); }
            }}
         />
         </ScrollArea>
      </>
   );
};

export default MyCalendar;