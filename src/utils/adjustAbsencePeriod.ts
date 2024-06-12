import dayjs from "dayjs";
import { ProcessedHolidayEvent } from "./types";
import isHolidayOrWeekend from "./isHolidayOrWeekend";

// Adjusts the absence period to exclude holidays and weekends
const adjustAbsencePeriod = (start: dayjs.Dayjs, end: dayjs.Dayjs, holidays: ProcessedHolidayEvent[]): { adjustedStart: dayjs.Dayjs, adjustedEnd: dayjs.Dayjs } => {
   let adjustedStart = start;
   let adjustedEnd = end;

   // Adjust start date
   while (isHolidayOrWeekend(adjustedStart, holidays)) { adjustedStart = adjustedStart.add(1, 'day'); }
   // Adjust end date
   while (isHolidayOrWeekend(adjustedEnd, holidays)) { adjustedEnd = adjustedEnd.subtract(1, 'day'); }

   return { adjustedStart, adjustedEnd };
};

export default adjustAbsencePeriod;