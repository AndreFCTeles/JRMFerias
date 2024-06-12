import dayjs from 'dayjs';
import { ProcessedHolidayEvent } from './types';

const isHolidayOrWeekend = (date: dayjs.Dayjs, holidays: ProcessedHolidayEvent[]): boolean => {
   const isWeekend = date.day() === 0 || date.day() === 6;
   const isHoliday = holidays.some(holiday => date.isSame(dayjs(holiday.start), 'day'));
   return isWeekend || isHoliday;
};

export default isHolidayOrWeekend;