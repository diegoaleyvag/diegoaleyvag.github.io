export { RESUME_UI_COPY } from "./copy.ts";
export {
  CANONICAL_CV_SOURCE_FILE,
  PUBLICATION_CONSENT_FILE,
  collectResumeFacts,
  createResumeProvenance,
  createResumeViewModel,
  loadPublicationConsent,
  loadResume,
  parseCvYaml,
  parsePublicationConsentYaml,
} from "./loader.ts";
export { cvSchema, publicationConsentSchema } from "./schema.ts";
export type {
  CvDocument,
  CvEducation,
  CvExperience,
  CvLink,
  CvProject,
  CvSkill,
  CvSourcePath,
  LoadedResume,
  PublicationConsent,
  ResumeEducationView,
  ResumeExperienceView,
  ResumeFact,
  ResumeLinkFacts,
  ResumeProjectView,
  ResumeProvenanceEntry,
  ResumeProvenanceManifest,
  ResumeSkillView,
  ResumeViewModel,
} from "./types.ts";
