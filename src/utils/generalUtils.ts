import fetchHolidays from './absences/fetchHolidays';
import { ProcessedHolidayEvent, JRMWorkerData } from './types';
//import { DepartmentData, DepColorMap } from './types';

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

// Parse de horas
export const toHours = (s: string) => {
   // Supports "1:30" → 1.5, "1" → 1, "0.5" → 0.5
   const [h, m] = s.split(':').map(Number);
   if (Number.isFinite(h) && Number.isFinite(m)) return h + m / 60;
   const f = Number(s);
   return Number.isFinite(f) ? f : 0;
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



/* --------------------------- */
/* UI - Lista de colaboradores */
/* --------------------------- */

// Extrair nomes de worker para UI
/*
export const getFirstAndLastName = (fullName: string): string => {
   const nameParts = fullName.split(' ');
   if (nameParts.length < 2) { return fullName; } // If there is only one part, return the full name
   const firstName = nameParts[0];
   const lastName = nameParts[nameParts.length - 1];
   return `${firstName} ${lastName}`;
};
*/
export const getFirstAndLastName = (fullName: string): string => {
   const parts = fullName.trim().split(/\s+/);
   if (parts.length < 2) return fullName.trim();
   return `${parts[0]} ${parts[parts.length - 1]}`;
};

// Contabilização dias/horas
export const getDayColor = (value: number) => {
   if (value < 5) return 'red';
   if (value >= 5 && value < 10) return 'orange';
   if (value >= 10 && value < 15) return 'yellow';
   return 'green';
};
export const getHourColor = (value: number) => {
   if (value < 3) return 'green';
   if (value >= 3 && value < 5) return 'yellow';
   if (value >= 5 && value < 8) return 'orange';
   return 'red';
};