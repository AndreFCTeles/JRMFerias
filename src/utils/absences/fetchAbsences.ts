import { Worker } from "../types";

const fetchAbsences = async () => {
   try {
      const workersResponse = await fetch('/api/getferias', { cache: 'no-store' });
      const { workers } = await workersResponse.json();
      const vacationEvents = workers.flatMap((worker: Worker) => worker.vacations.map(vacation => ({
         id: worker.id,
         title: `${worker.title} (Férias)`,
         eventId: vacation.id,
         start: vacation.start,
         end: vacation.end,
         color: worker.color,
      })));
      const offDayEvents = workers.flatMap((worker: Worker) => worker.offDays.map(offDay => ({
         id: worker.id,
         title: `${worker.title} (Ausência)`,
         eventId: offDay.id,
         start: offDay.start,
         end: offDay.end || offDay.start,
         color: worker.color,
      })));
      const absence = [...vacationEvents, ...offDayEvents];
      return absence;
   } catch (error) {
      console.error("Error fetching worker events:", error);
      return [];
   }
};

export default fetchAbsences;