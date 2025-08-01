interface Worker {
   id: number;
   title: string;
   start: string;
   end: string;
   color: string;
}
interface WorkerOffDays {
   workers: Worker[];
}

async function fetchWorkers(): Promise<Worker[]> {
   try {      
      const response = await fetch('/data/funcionarios.json'); // Adjust the path as necessary
      if (!response.ok) {
         throw new Error(`Failed to fetch worker off-days: ${response.status}`);
      }
      const data: WorkerOffDays = await response.json();
      return data.workers; // Assuming the JSON structure matches the provided sample
   } catch (error) {
      console.error("Error fetching worker off-days:", error);
      throw error; // Rethrow the error if you want to handle it elsewhere (e.g., to show a message to the user)
   }
}

export default fetchWorkers;