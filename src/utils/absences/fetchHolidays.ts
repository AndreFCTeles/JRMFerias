import { EventText, HolidayAPIEvent } from "../types";

const PUBLIC_HOLIDAYS_URL = `https://openholidaysapi.org/PublicHolidays`;

const fetchHolidays = async (year: number) => {
   const validFrom = `${year}-01-01`;
   const validTo = `${year}-12-31`;
   try {
      const holidaysResponse = await fetch(`${PUBLIC_HOLIDAYS_URL}?countryIsoCode=PT&languageIsoCode=PT&validFrom=${validFrom}&validTo=${validTo}&subdivisionCode=PT-AV-AV`);
      const holidaysData = await holidaysResponse.json();      
      const processedHolidayEvents = holidaysData.map((holiday: HolidayAPIEvent) => ({ // Assuming a separate interface for holiday or dynamically typing as any
         id: holiday.id,
         title: holiday.name?.find((n: EventText) => n.language === 'PT')?.text || 'Holiday',
         start: holiday.startDate ,
         end: holiday.endDate || holiday.startDate,
         backgroundColor: 'rgba(255,0,0,0.3)',
         textColor: 'black',
         display: 'background',
      }));
      return processedHolidayEvents;
   } catch (error) { console.error("Error fetching holiday events:", error); }
};

export default fetchHolidays;