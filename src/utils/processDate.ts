import dayjs from 'dayjs';
import 'dayjs/locale/pt';
dayjs.locale('pt');
const processDate = (dateVal:Date|string, inc?:number) => {
   const toProcess = dateVal;
   const processed = inc 
      ? dayjs(toProcess).add(inc, 'day').format('YYYY-MM-DD') 
      : dayjs(toProcess).format('YYYY-MM-DD') ;
   return processed
};
export default processDate;