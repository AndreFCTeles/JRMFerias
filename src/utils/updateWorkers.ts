const updateWorker = async (workerId: string, updatedData: object) => {
   try {
      const response = await fetch(`/api/workers/${workerId}`, {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(updatedData),
      });
      if (!response.ok) { throw new Error('Editação de colaborador falhou - Aplicação'); }

      const result = await response.json();
      console.log(result.message);
   } catch (error) { console.error('Erro ao editar colaborador - Aplicação:', error); }
};

export default updateWorker;