import dayjs from 'dayjs';
import { calculateBusinessDays, calculateAbsenceHours, generateAbsenceId } from "../generalUtils";
import { JRMWorkerData } from "../types";

interface UpdateAbsenceData {
   type?: 'vacation' | 'off-day';
   id?: string;
   start: Date | string;
   end?: Date | string;
   allDay?: boolean;
   busDays?: number;
   absTime?: number;
   lunch?: boolean;
}

const updateAbsence = async (workers: JRMWorkerData[], eventId: string, updatedData: UpdateAbsenceData) => {
   try {
      console.log('Received in updateAbsence:', JSON.stringify(updatedData, null, 2));
      
      // Inferir worker e tipo de evento selecionado através de ID
      const [workerId, typeCode ] = eventId.split('-');
      const worker = workers.find((w: JRMWorkerData) => w.id === workerId);
      if (!worker) throw new Error("Worker not found.");

      const currentEventType = typeCode === '1' ? 'vacation' : 'off-day';
      const eventTypeHasChanged = currentEventType !== updatedData.type;

      console.log("-------------------------------------------------------");
      console.log("did event type change?",eventTypeHasChanged);
      console.log("current event type:", currentEventType);
      console.log("type after update: ", updatedData.type);
      console.log("-------------------------------------------------------");

      // Redundante no caso de eventResize e eventDrop, mas necessário na criação de dados
      if (updatedData.type === 'off-day' && !updatedData.allDay) {
         updatedData.start = `${dayjs(updatedData.start).format('YYYY-MM-DD')}T${dayjs(updatedData.start).format('HH:mm')}`;
         updatedData.end = `${dayjs(updatedData.end).format('YYYY-MM-DD')}T${dayjs(updatedData.end).format('HH:mm')}`;
      } else {
         updatedData.start = dayjs(updatedData.start).format('YYYY-MM-DD');
         updatedData.end = dayjs(updatedData.end).format('YYYY-MM-DD');
      }

      // Calcular novos valores
      let newBusDays = 0;
      let newAbsTime = 0;
      if (updatedData.type === 'vacation' || updatedData.allDay) {
         newBusDays = await calculateBusinessDays(dayjs(updatedData.start), dayjs(updatedData.end));
         updatedData.busDays = newBusDays;
      } else {
         newAbsTime = calculateAbsenceHours(updatedData.start, updatedData.end);
         if (updatedData.lunch && worker.lunchH) { newAbsTime -= worker.lunchH; }
         updatedData.absTime = newAbsTime;
      }

      // Gerar ID se tipo de evento mudar
      if (eventTypeHasChanged) {
         console.log("as the event type has changed, we generate a new Id");
         updatedData.id = generateAbsenceId(worker, updatedData.type as 'vacation' | 'off-day');
      } else { updatedData.id = eventId; }
      console.log("updated data: ", updatedData);
      console.log("^ This is the data that will be sent to the backend.");

      // Enviar dados para API
      const response = await fetch(`/api/editferias/${eventId}`, {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(updatedData),
      });
      if (!response.ok) { throw new Error('Failed to update absence'); }

      const result = await response.json();
      console.log(result.message);

      return workers.map(w => w.id === workerId ? worker : w);
   } catch (error) {
      console.error('Error updating absence:', error);
      throw error;
   }
};

export default updateAbsence;