const deleteAbsence = async (eventId: string) => {
   try {
      const response = await fetch(`/api/deleteferias/${eventId}`, { method: 'DELETE', });
      if (!response.ok) { throw new Error('Failed to delete absence'); }

      const result = await response.json();
      console.log(result.message);
   } catch (error) {
      console.error('Error deleting absence:', error);
      throw error;
   }
};

export default deleteAbsence;
