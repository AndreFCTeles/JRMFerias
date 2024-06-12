import dayjs from 'dayjs';
import { ProcessedHolidayEvent } from './types';
import isHolidayOrWeekend from './isHolidayOrWeekend';

const calculateBusinessDays = (startDate: dayjs.Dayjs, endDate: dayjs.Dayjs, holidays: ProcessedHolidayEvent[]): number => {
   let count = 0;
   let currentDate = startDate;

   while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
      if (!isHolidayOrWeekend(currentDate, holidays)) { count++; }
      currentDate = currentDate.add(1, 'day');
   }

   return count;
};

export default calculateBusinessDays;
