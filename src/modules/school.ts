import { ModifiedApp } from "./slackapp";

// #blackbaudapiyummy
export interface AssignmentsReqPayload {
  SectionId: number;
  AssignmentId: number;
  DateAssigned?: any;
  DropBoxLateTime?: any;
  AssignmentIndexId: number;
  IncGradeBook: number;
  PublishGrade: number;
  EnrollCount: number;
  GradedCount: number;
  DropBoxId: number;
  HasLink: number;
  HasDownload: number;
  AssignmentStatus: number;
  AssessmentLocked: number;
  ShowReport: number;
  LocalNow?: any;
  Major: number;
  FormativeInd: number;
  DisableDropdown: number;
  NewAssessmentInd: number;
  IncompleteInd: number;
  LateInd: number;
  MissingInd: number;
  RubricInd: number;
  UserTaskInd: number;
  MaxPoints: number;
  MarkingPeriodId: number;
  TaskStatus: number;
  AssessmentPaused: boolean;
  HasQuestions: boolean;
  ReadyForTaking: boolean;
  CanTakeAssessment: boolean;
  CanSeeAssessmentResults: boolean;
  ExtraCredit: boolean;
  ActiveTerm: boolean;
  UserTaskId: number;
  Missing: Missing[];
  Overdue: any[];
  DueToday: any[];
  DueTomorrow: Missing[];
  DueThisWeek: Missing[];
  DueNextWeek: Missing[];
  DueAfterNextWeek: any[];
  PastThisWeek: any[];
  PastLastWeek: Missing[];
  PastBeforeLastWeek: Missing[];
  Sections: Section[];
  AssessmentInd: number;
  HasGrade: number;
  HasCompetencyGrade: boolean;
  HasAssessmentResults: boolean;
  AssessmentLatestResult: boolean;
  AssessmentForceRetake: boolean;
  AssessmentAllowPause: boolean;
  AssessmentSubmittedDate?: any;
  AssessmentAttemptNumber: number;
  AssessmentNumAttempts: number;
  ReadyInd: boolean;
  StudentStatus: number;
  OnPaperSubmission: number;
  DropBoxInd: number;
  DateDue?: any;
  CollectedInd: boolean;
  ExemptInd: number;
  DiscussionInd: number;
  MessageCount: number;
  LtiInd: number;
  DropBoxToDo: boolean;
}

export interface Section {
  LeadSectionId: number;
  SectionId: number;
  CurrentSectionId: number;
  Association: number;
  OfferingId: number;
  GroupName: string;
  IsOwner: boolean;
  UserId: number;
  CourseLength: number;
  PublishGroupToUser: boolean;
  CurrentEnrollment: boolean;
  IsMyGroup: boolean;
  IsMyChildsGroup: boolean;
  IsContentOwner: boolean;
}

export interface Missing {
  GroupName: string;
  SectionId: number;
  AssignmentId: number;
  ShortDescription: string;
  DateAssigned: string;
  DropBoxLateTime?: any;
  AssignmentIndexId: number;
  AssignmentType: string;
  IncGradeBook: number;
  PublishGrade: number;
  EnrollCount: number;
  GradedCount: number;
  DropBoxId: number;
  HasLink: number;
  HasDownload: number;
  AssignmentStatus: number;
  AssessmentLocked: number;
  ShowReport: number;
  LocalNow: string;
  Major: number;
  FormativeInd: number;
  DisableDropdown: number;
  NewAssessmentInd: number;
  IncompleteInd: number;
  LateInd: number;
  MissingInd: number;
  RubricInd: number;
  UserTaskInd: number;
  MaxPoints: number;
  MarkingPeriodId: number;
  MarkingPeriodDescription: string;
  TaskStatus: number;
  AssessmentPaused: boolean;
  HasQuestions: boolean;
  ReadyForTaking: boolean;
  CanTakeAssessment: boolean;
  CanSeeAssessmentResults: boolean;
  ExtraCredit: boolean;
  ActiveTerm: boolean;
  UserTaskId: number;
  AssignmentTasks: any[];
  AssessmentInd: number;
  HasGrade: number;
  HasCompetencyGrade: boolean;
  HasAssessmentResults: boolean;
  AssessmentLatestResult: boolean;
  AssessmentForceRetake: boolean;
  AssessmentAllowPause: boolean;
  AssessmentSubmittedDate?: any;
  AssessmentAttemptNumber: number;
  AssessmentNumAttempts: number;
  ReadyInd: boolean;
  StudentStatus: number;
  OnPaperSubmission: number;
  DropBoxInd: number;
  DateDue: string;
  AssignmentStatusType: number;
  CollectedInd: boolean;
  ExemptInd: number;
  DiscussionInd: number;
  MessageCount: number;
  AssignmentStatusBehavior: number;
  LtiInd: number;
  DropBoxToDo: boolean;
}
export async function fetchAssignments() {
  return fetch(
    "https://kcd.myschoolapp.com/api/assignment2/StudentAssignmentCenterGet?displayByDueDate=true",
    {
      headers: {
        "content-type": "application/json",
        cookie: Buffer.from(process.env.KCD_COOKIE, "base64").toString(),
      },
    },
  )
    .then((r) => r.json())
    .then((d) => d as AssignmentsReqPayload);
}
export function tempcronjob(app: ModifiedApp) {
  setInterval(() => {
    fetchAssignments().then((d) => {
      if (d.ActiveTerm || d.AssignmentId || d.SectionId || d.DateDue) {
        if (!app.db.get("mykcd_check")) {
          app.client.chat.postMessage({
            channel: `C07LEEB50KD`,
            text: `Hey neon! mykcd api is working and has a working cookie and its not broken!!... writting down the timestamp`,
          });
          app.db.set("mykcd_check", Date.now());
        }
      } else {
        if (!app.db.get("mykcd_fail")) {
          app.client.chat.postMessage({
            channel: `C07LEEB50KD`,
            text: `Hey neon! mykcd api is not working and has a broken cookie... it worked for ${Date.now() - app.db.get("mykcd_check")}ms\n${JSON.stringify(d)}`,
          });
          app.db.set("mykcd_fail", Date.now());
        }
      }
    });
  }, 120 * 1000);
}
