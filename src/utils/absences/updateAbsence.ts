// Podia simplesmente importar Absence, mas prefiro separar para não fazer confusão
interface UpdateAbsenceData {
   start: Date | string;
   end: Date | string;
}

const updateAbsence = async (eventId: string, updatedData: UpdateAbsenceData) => {
   try {
      const response = await fetch(`/api/editferias/${eventId}`, {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(updatedData),
      });
      if (!response.ok) { throw new Error('Failed to update absence'); }

      const result = await response.json();
      console.log(result.message);
   } catch (error) {
      console.error('Error updating absence:', error);
      throw error;
   }
};

export default updateAbsence;
