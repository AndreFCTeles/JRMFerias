import fetchHolidays from './absences/fetchHolidays';
import { ProcessedHolidayEvent, JRMWorkerData } from './types';

import dayjs from "dayjs";
import 'dayjs/locale/pt';
dayjs.locale('pt');



/* ------------- */
/* GESTÃO DE IDs */
/* ------------- */

// Geraração de IDs
export const generateAbsenceId = (worker: JRMWorkerData, type: 'vacation' | 'off-day'): string => {
   const absences = type === 'vacation' ? worker.vacations : worker.offDays;

   // Extrair cada parte de cada ID, inferir valor mais alto
   const existingIds = absences.map(({ id }) => {
      const parts = id.split('-');
      return parts.length === 3 ? parseInt(parts[2], 10) : 0;
   });

   // Determinar novo incremento para ID
   const newIncrement = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
   const newId = `${worker.id}-${type === 'vacation' ? '1' : '2'}-${newIncrement}`;

   return newId;
};

// Extrair tipo de evento através de ID
export const getVacationTypeFromId = (id: string): 'vacation' | 'off-day' => {
   const typeCode = id.split('-')[1];
   return typeCode === '1' ? 'vacation' : 'off-day';
};

// Extrair worker através de ID
export const getWorkerFromId = (id: string) => {
   const wId = id.split('-')[0];
   return wId;
};


/* ------------------------- */
/* GESTÃO DE DATAS/AUSÊNCIAS */
/* ------------------------- */

// Verificação para feriados/fins de semana
export const isHolidayOrWeekend = (date: dayjs.Dayjs, holidays: ProcessedHolidayEvent[]): boolean => {
   const isWeekend = date.day() === 0 || date.day() === 6;
   const isHoliday = holidays.some(holiday => date.isSame(dayjs(holiday.start), 'day'));
   return isWeekend || isHoliday;
};

// Verificação para fins de semana
export const isWeekend = (date: Date) => {
   const day = date.getDay();
   return day === 0 || day === 6; // Sunday = 0, Saturday = 6
};

// Calcular horas em ausências parciais
export const calculateAbsenceHours = (start: string, end: string): number => {
   const startTime = dayjs(start);
   const endTime = dayjs(end);
   const totalHours = endTime.diff(startTime, 'hour', true);
   return totalHours;
};

// Formatar datas
export const processDate = (dateVal:Date|string, inc?:number) => {
   const toProcess = dateVal;
   const processed = inc 
      ? dayjs(toProcess).add(inc, 'day').format('YYYY-MM-DD') 
      : dayjs(toProcess).format('YYYY-MM-DD') ;
   return processed
};

// Ajuste de ausência com base nos dias úteis
export const adjustAbsencePeriod = (start: dayjs.Dayjs, end: dayjs.Dayjs, holidays: ProcessedHolidayEvent[]): { adjustedStart: dayjs.Dayjs, adjustedEnd: dayjs.Dayjs } => {
   let adjustedStart = start;
   let adjustedEnd = end;   
   while (isHolidayOrWeekend(adjustedStart, holidays)) { adjustedStart = adjustedStart.add(1, 'day'); }
   while (isHolidayOrWeekend(adjustedEnd, holidays)) { adjustedEnd = adjustedEnd.subtract(1, 'day'); }
   return { adjustedStart, adjustedEnd };
};

// Cálculo de dias úteis para ausências
export const calculateBusinessDays = async (startDate: dayjs.Dayjs, endDate: dayjs.Dayjs): Promise<number> => {
   const holidays: ProcessedHolidayEvent[] = await fetchHolidays(startDate.year());
   let count = 0;
   let currentDate = startDate;
   while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
      if (!isHolidayOrWeekend(currentDate, holidays)) { count++; }
      currentDate = currentDate.add(1, 'day');
   }
   return count;
};