const newWorker = async (data: object) => {
   try {      
      const response = await fetch('/api/novocolab', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(data),
      });
      if (!response.ok) { throw new Error('Processamento de novos dados de colaborador falhou - Aplicação'); }

      const result = await response.json();
      console.log(result.message);
   } catch (error) { console.error('Erro ao adicionar colaborador - Aplicação:', error); }
};

export default newWorker;