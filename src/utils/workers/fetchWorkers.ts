import { JRMWorkerData, WorkersArray } from '../types';

const fetchWorkers = async (): Promise<JRMWorkerData[]> => {
   try {      
      const response = await fetch('/api/getferias');
      if (!response.ok) { throw new Error(`Falha na busca de ausências - FetchRequest: ${response.status}`); }
      const data: WorkersArray = await response.json();
      return data.workers;
   } catch (error) {
      console.error("Erro na busca de ausências - FetchRequest:", error);
      throw error;
   }
}

export default fetchWorkers;