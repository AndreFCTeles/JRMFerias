export interface Credential {
   username: string;
   password: string;
}

export interface Absence {
   id: string;
   start: Date | string;
   end?: Date | string;
}

export interface EventText {
   language: string;
   text: string;
}


export interface Worker {
   id: string;
   title: string;
   dep?: string;
   vacations: Absence[];
   offDays: Absence[];
   color: string;
   avaDays: number;
}

export interface CalendarEvent {
   id: string;
   title: string;
   eventId: string;
   start: string;
   end: string;
   borderColor?: string;
   backgroundColor?: string;
   textColor?: string;
   allDay?: boolean;
   display?: string;
}

export interface HolidayAPIEvent {
   id: string;
   startDate: string;
   endDate: string;
   type?: string;
   quality?: string;
   name?: EventText[];
   nationwide?: boolean;
   title?: string;
}
export interface ProcessedHolidayEvent {
   id: string;
   title: string;
   eventId: string;
   start: string;
   end: string;
   borderColor?: string;
   backgroundColor?: string;
   textColor?: string;
   display: string;
}

export interface NewAbsenceRequest {
   id: string;
   absence: Absence;
   type: 'vacation' | 'off-day';
}

export interface WorkersArray {
   workers: Worker[];
}

export interface CredentialsResponse {
   credentials: Credential[];
}