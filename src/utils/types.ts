// AUTHENTICATION
export interface Credential {
   username: string;
   password: string;
}
export interface CredentialsResponse {
   credentials: Credential[];
}


// ABSENCE
export interface AbsenceBase {
   start: Date | string;
   end?: Date | string;
   allDay?: boolean;
   busDays?: number;
   absTime?: number;
   lunch?: boolean;
}
export interface Absence extends AbsenceBase {
   id: string;
}
export interface NewAbsenceRequest {
   id: string;
   absence: Absence;
   type: 'vacation' | 'off-day';
}
export interface NewAbsenceData extends AbsenceBase {
   type: 'vacation' | 'off-day';
}
export interface UpdateAbsenceData extends AbsenceBase {
   type?: 'vacation' | 'off-day';
   id?: string;
}


// CALENDAR
export interface EventText {
   language: string;
   text: string;
}
export interface DepartmentData {
   depName: string;
   depDefColor: string;
}
export interface JRMWorkerData {
   id: string;
   title: string;
   displayName?: string;
   dep?: string;
   vacations: Absence[];
   offDays: Absence[];
   color: string;
   avaDays: number;
   compH?: number;
   lunchH?: number;
}
export interface CalendarEvent {
   id: string;
   workerId?: string;
   title: string;
   eventId: string;
   department?: string;
   start: string;
   end: string;
   borderColor?: string;
   backgroundColor?: string;
   textColor?: string;
   allDay?: boolean;
   display?: string;
   busDays?: number;
   absTime?: number;
   lunch?: boolean;
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
export interface WorkersArray {
   workers: JRMWorkerData[];
}