import { Worker } from "../src/utils/types";

const fetchAbsences = async () => {
   try {
      const workersResponse = await fetch('/api/getferias', { cache: 'no-store' });
      const { workers } = await workersResponse.json();
      const vacationEvents = workers.flatMap((worker: Worker) => worker.vacations.map(vacation => ({
         id: worker.id,
         title: `${worker.title} (Férias)`,
         start: vacation.start,
         end: vacation.end,
         color: worker.color,
      })));
      const offDayEvents = workers.flatMap((worker: Worker) => worker.offDays.map(offDay => ({
         id: worker.id,
         title: `${worker.title} (Ausência)`,
         start: offDay.start,
         end: offDay.end || offDay.start,
         color: worker.color,
      })));
      const absences = [...vacationEvents, ...offDayEvents];

      return (absences);
   } catch (error) { console.error("Error fetching worker events:", error); }
};

export default fetchAbsences;