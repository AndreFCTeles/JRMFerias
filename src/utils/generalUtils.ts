import fetchHolidays from './absences/fetchHolidays';
import { ProcessedHolidayEvent, JRMWorkerData, NameDisplay } from './types';

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

// Generator: fornece dias locais inclusivos correspondendo ao atributo [data-date="YYYY-MM-DD"] do FullCalendar 
// Diferenciamento de labels para eventos (feriados/ausências, backgroundEvent/regularEvent)
export function* eachDayKeyInclusive(start: Date | string, end: Date | string) {
   let d = dayjs(start).startOf('day');
   const last = dayjs(end).startOf('day');
   while (!d.isAfter(last, 'day')) {
      yield d.format('YYYY-MM-DD');
      d = d.add(1, 'day');
   }
};
// Transforma resultado de generator em array, caso necessário
export const expandInclusive = (start: Date | string, end: Date | string) => 
   Array.from(eachDayKeyInclusive(start, end));




/* --------------------------- */
/* UI - Lista de colaboradores */
/* --------------------------- */

// Extrair nomes de worker para UI
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



/* ------------- */
/* SEARCH/FILTER */
/* ------------- */

// normalização e comparação de strings
export const norm = (input: string) => {
if (typeof input !== 'string') return '';
   let s = input.normalize('NFKD'); // normalização Unicode (split base + acentuação) - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize
   s = s.toLowerCase()
      .replace(/[\p{M}]/gu, '') // Remove símbolos especiais
      .replace(/\s+/g, ' ') // Remove todo o whitespace
      .replace(/[^a-z0-9]/g, ''); // Remove pontuação/tudo o que não seja a-z ou 0-9
   return s;
};
export const tokenize = (s: string) => /*norm(s)*/s.split(/\s+/).filter(Boolean);
export const matchesAll = (haystack: string, terms: string[]) => {
   const h = haystack; // ou norm(haystack) - normalizado pode interferir com nomes portugueses (como André lmao)
   return terms.every((t) => h.includes(t));
};
// Agrupar workers por departamento + ordenar por label resolvido
export const shortOf = (full: string) => getFirstAndLastName(full || '');
export const trimOrEmpty = (s?: string | null) => (s || '').trim();
export const resolveWorkerLabel = (
   worker: JRMWorkerData, 
   mode: NameDisplay
): { label: string; tooltip: string } => {
   const full = trimOrEmpty(worker.title);
   const short = shortOf(full);
   const disp = trimOrEmpty(worker.displayName);

   if (mode === 'full') {return { label: full, tooltip: disp || short };}
   if (mode === 'short') {return { label: short, tooltip: disp || full };}
   return { label: disp || short, tooltip: full };
}