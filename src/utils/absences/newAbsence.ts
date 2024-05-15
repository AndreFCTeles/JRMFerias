import { NewAbsenceRequest, Absence, Worker } from "../types";
import fetchWorkers from "../workers/fetchWorkers";
import processDate from "../processDate";

const generateAbsenceId = (worker: Worker, type: 'vacation' | 'off-day'): string => {
   const absences = type === 'vacation' ? worker.vacations : worker.offDays;
   const newIncrement = absences.reduce((max, { id }) => {
      const [, , increment] = id.split('-').map(Number);
      return Math.max(max, increment);
   }, 0) + 1;
   return `${worker.id}-${type === 'vacation' ? '1' : '2'}-${newIncrement}`;
};

const newAbsence = async (selectedWorkerId: string, type: 'vacation' | 'off-day', startDate: Date|string, endDate: Date|string) => {
   try {
      const workers = await fetchWorkers();
      const worker = workers.find(worker => worker.id === selectedWorkerId);
      if (!worker) throw new Error("Selected worker not found.");

      const newAbsenceId = generateAbsenceId(worker, type);
      const absence: Absence = {
         id: newAbsenceId,
         start: processDate(startDate) ,
         end: type === 'vacation' ? processDate(endDate) : processDate(startDate),
      };

      const absenceData: NewAbsenceRequest = {
         id: selectedWorkerId,
         absence,
         type,
      };

      const response = await fetch('/api/postferias', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(absenceData),
      });
      if (!response.ok) throw new Error('Failed to create new absence');

      const result = await response.json();
      console.log(result.message);
   } catch (error) {
      console.error('Error creating new absence:', error);
      throw error; // Rethrow for handling in the calling context
   }
};

export default newAbsence;