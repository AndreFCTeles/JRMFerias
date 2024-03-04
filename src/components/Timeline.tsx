// src/MyTimeline.tsx
import React from 'react';
import Timeline from 'react-calendar-timeline';
import 'react-calendar-timeline/lib/Timeline.css';
import moment from 'moment';


const MyTimeline: React.FC = () => {
   const groups = [
      { id: 1, title: 'Worker 1' },
      { id: 2, title: 'Worker 2' },
   ];

   const items = [
      {
         id: 1,
         group: 1,
         title: 'Vacation',
         start_time: moment(),
         end_time: moment().add(1, 'week'),
      },
      {
         id: 2,
         group: 2,
         title: 'Off Days',
         start_time: moment().add(-0.5, 'weeks'),
         end_time: moment().add(0.5, 'weeks'),
      },
   ];

   return (
      <Timeline
         groups={groups}
         items={items}
         defaultTimeStart={moment().add(-12, 'hour')}
         defaultTimeEnd={moment().add(12, 'hour')}
      />
   );
};

export default MyTimeline;
