const deleteWorker = async (workerId: string) => {
   try {
      const response = await fetch(`/api/eliminarColab/${workerId}`, { method: 'DELETE', });
      if (!response.ok) { throw new Error('Erro ao eliminar colaborador - Aplicação') }

      const result = await response.json();
      console.log(result.message);
   } catch (error) { console.error('Erro ao eliminar colaborador - Aplicação:', error); }
};

export default deleteWorker;