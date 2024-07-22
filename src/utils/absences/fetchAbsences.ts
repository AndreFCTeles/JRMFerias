import { JRMWorkerData } from "../types";

const fetchAbsences = async () => {
   try {
      const workersResponse = await fetch('/api/getferias', { cache: 'no-store' });
      const { workers } = await workersResponse.json();
      const vacationEvents = workers.flatMap((worker: JRMWorkerData) => worker.vacations.map(vacation => ({
         id: vacation.id,
         title: `${worker.title} (Férias)`,
         eventId: vacation.id,
         workerId: worker.id,
         start: vacation.start,
         end: vacation.end,
         borderColor: worker.color,
         backgroundColor: worker.color, 
         textColor: 'auto',
         display: 'block',
         type: 'vacation',
         busDays: vacation.busDays
      })));
      const offDayEvents = workers.flatMap((worker: JRMWorkerData) => worker.offDays.map(offDay => ({
         id: offDay.id,
         title: `${worker.title} (Ausência)`,
         eventId: offDay.id,
         workerId: worker.id,
         start: offDay.start,
         end: offDay.end, //|| offDay.start,
         borderColor: worker.color,
         backgroundColor: worker.color, 
         textColor: 'auto',
         display: 'block',
         type: 'off-day',
         allDay: offDay.allDay,
         absTime: offDay.absTime,
         lunch: offDay.lunch
      })));
      const absence = [...vacationEvents, ...offDayEvents];

      return absence;
   } catch (error) {
      console.error("Error fetching worker events:", error);
      return [];
   }
};

export default fetchAbsences;