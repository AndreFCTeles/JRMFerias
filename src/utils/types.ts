// USER SETTINGS
export const LS_LAST             = 'jrm_lastUsername';   // last username (conveniência)
export const LS_REMEMBER         = 'jrm_rememberMe';     // '1' | '0'  (remember username)
export const LS_SAVED            = 'jrm_savedUsername';  // username remembered
export const LS_KEEP             = 'jrm_persistLogin';   // '1' = keep logged-in
export const LS_AUTH             = 'jrm_auth';           // JSON blob - saved creds
export const LS_VIEW             = 'jrm_calView';        // 'dayGridMonth' | 'multiMonthYear'
export const LS_NAME_DISPLAY     = 'jrm_nameDisplay';    // 'full' | 'short' | 'displayName'
export const LS_THEME            = 'jrm_colorScheme';    // 'light' | 'dark' if not using Mantine’s manager)

export type CalendarView         = 'dayGridMonth' | 'multiMonthYear';
export type NameDisplay          = 'full' | 'short' | 'displayName';

export const APP_NAME            = 'JRMFerias';
export const BUSINESS_WORKER_ID  = '1';                  // Electrex

// AUTHENTICATION
export type Role                 = 'user' | 'editor' | 'admin' | 'superadmin';
export type Status               = 'ativo' | 'desativado' | 'bloqueado';
export type CredentialSafe = {
   _id: string;
   nome: string;
   username: string;
   email?: string | null;
   active: boolean;
   status: Status;
   roles: Role | null;                                   // global role
   apps: Record<string, { roles?: Role }>;               // sanitized (no appPass)
};
export type SavedAuth = {
   username: string;                                     // username
   password: string;                                     // appPass
   app: string;                                          // APP_NAME
};


// WORKER/DEP CHECKBOXES
export type Selections = { 
   workers: string[]; 
   departments: string[] 
};


// ABSENCE
export interface AbsenceBase {
   start: Date | string;
   end?: Date | string;
   allDay?: boolean;
   busDays?: number;
   absTime?: number;
   lunch?: boolean;
}
export interface Absence extends AbsenceBase { id: string; }
export interface NewAbsenceData extends AbsenceBase { type: 'vacation' | 'off-day'; }
export interface UpdateAbsenceData extends AbsenceBase {
   type?: 'vacation' | 'off-day';
   id?: string;
}
export interface NewAbsenceRequest {
   id: string;
   absence: Absence;
   type: 'vacation' | 'off-day';
}


// WORKERS
export interface JRMWorkerData {
   id: string;
   title: string;
   displayName?: string;
   dep: string;
   vacations: Absence[];
   offDays: Absence[];
   color: string;
   avaDays: number;
   compH?: number;
   lunchH?: number;
}
export interface WorkersArray { workers: JRMWorkerData[]; }
// DEPARTMENTS
export interface DepartmentData {
   depName: string;
   depKey: string;
   depDefColor: string;
}


// CALENDAR DATA
export interface EventText {
   language: string;
   text: string;
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
export type Hover = // tooltip behavior
   | { 
      kind: 'day'; 
      key: string; 
      selector: string; 
      label: string 
   } | { 
      kind: 'event'; 
      key: string; 
      selector: string; 
      label: string 
   } | null;