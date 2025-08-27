import { DepartmentData } from "../types";

const fetchDepartments = async (): Promise<DepartmentData[]> => {
   try {      
      const response = await fetch('/api/ferias/getdepartments');
      if (!response.ok) { throw new Error(`Falha na busca de departamentos - FetchRequest: ${response.status} - ${response.statusText}`); }
      const { departments } = await response.json();
      return departments as DepartmentData[];
   } catch (error) {
      console.error("Erro na busca de ausências - FetchRequest:", error);
      throw error;
   }
}
export default fetchDepartments;