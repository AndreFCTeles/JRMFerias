import { EventText, HolidayAPIEvent, ProcessedHolidayEvent } from "../types";

const PUBLIC_HOLIDAYS_URL = `https://openholidaysapi.org/PublicHolidays`;

const fetchHolidays = async (year: number): Promise<ProcessedHolidayEvent[]> => {
   const validFrom = `${year}-01-01`;
   const validTo = `${year}-12-31`;
   try {
      const holidaysResponse = await fetch(`${PUBLIC_HOLIDAYS_URL}?countryIsoCode=PT&languageIsoCode=PT&validFrom=${validFrom}&validTo=${validTo}&subdivisionCode=PT-AV-AV`);
      console.log(`https://openholidaysapi.org/PublicHolidays?countryIsoCode=PT&languageIsoCode=PT&validFrom=${validFrom}&validTo=${validTo}&subdivisionCode=PT-AV-AV`)
      console.log(holidaysResponse);
      if (!holidaysResponse.ok) {
         throw new Error('Failed to fetch holidays: API service is unavailable.');
      }
      const holidaysData = await holidaysResponse.json();      
      const processedHolidayEvents = holidaysData.map((holiday: HolidayAPIEvent) => ({
         id: holiday.id,
         title: holiday.name?.find((n: EventText) => n.language === 'PT')?.text || 'Holiday',
         eventId: '',
         start: holiday.startDate ,
         end: holiday.endDate || holiday.startDate,
         borderColor: undefined,
         backgroundColor: 'rgba(255,0,0,0.3)',
         textColor: 'black',
         display: 'background',
         allDay: true
      }));
      console.log(holidaysData)
      return processedHolidayEvents;
   } catch (error) { 
      console.error("Error fetching holiday events:", error); 
      // throw error; // Propagate error to the calling function
      return [];
   }
};

export default fetchHolidays;