import { NewAbsenceRequest, Absence, JRMWorkerData } from "../types";
import { processDate, generateAbsenceId } from "../generalUtils";



interface NewAbsenceData {
   type: 'vacation' | 'off-day';
   start: Date | string;
   end?: Date | string;
   allDay?: boolean;
   busDays?: number;
   absTime?: number;
   lunch?: boolean;
}

const newAbsence = async (workers: JRMWorkerData[], selectedWorkerId: string, eventData: NewAbsenceData ) => {
   
   console.log(" ");
   console.log("-----------");
   console.log("NEW ABSENCE");
   console.log(" ");
   
   console.log("Received event data: ", eventData);
   console.log("Selected worker: ", selectedWorkerId);
   try {
      // Encontrar worker através de ID
      const worker = workers.find((worker:JRMWorkerData) => worker.id === selectedWorkerId);
      if (!worker) throw new Error("Selected worker not found.");
      if (!eventData.end) eventData.end = eventData.start;

      // Gerar ID de evento
      const newAbsenceId = generateAbsenceId(worker, eventData.type);
      const absence: Absence = {
         id: newAbsenceId,
         start: processDate(eventData.start),
         end: eventData.type === 'vacation' ? processDate(eventData.end) : processDate(eventData.start),
      };

      // Atribuir campos de dados consoante tipo de evento
      if (eventData.type === 'vacation') {
         absence.busDays = eventData.busDays;
      } else if (eventData.type === 'off-day') {
         absence.allDay = eventData.allDay;
         if (eventData.allDay) { absence.busDays = 1; } 
         else {
            absence.absTime = eventData.absTime;
            absence.lunch = eventData.lunch;
         }
         absence.start = eventData.start;
         absence.end = eventData.end;
      }
   
      // Construir objeto e enviar dados para API
      const absenceData: NewAbsenceRequest = {
         id: selectedWorkerId,
         absence,
         type: eventData.type
      };

      const response = await fetch('/api/postferias', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(absenceData),
      });
      if (!response.ok) throw new Error('Failed to create new absence');

      const result = await response.json();
      console.log(result.message);
      return worker;
   } catch (error) {
      console.error('Error creating new absence:', error);
      throw error;
   }
};

export default newAbsence;