export interface CvLink {
  readonly label: string;
  readonly url: string;
}

export interface CvExperience {
  readonly organisation: string;
  readonly role: string;
  readonly programme: string;
  readonly dates: string;
  readonly location: string;
  readonly bullets: readonly string[];
}

export interface CvProject {
  readonly name: string;
  readonly descriptor: string;
  readonly dates: string;
  readonly bullets: readonly string[];
}

export interface CvEducation {
  readonly institution: string;
  readonly credential: string;
  readonly dates: string;
  readonly location: string;
  readonly detail: string;
}

export interface CvSkill {
  readonly label: string;
  readonly value: string;
}

export interface CvDocument {
  readonly name: string;
  readonly headline: string;
  readonly location: string;
  readonly availability: string;
  readonly email: string;
  readonly linkedin: CvLink;
  readonly github: CvLink;
  readonly summary: string;
  readonly experience: readonly CvExperience[];
  readonly projects: readonly CvProject[];
  readonly education: readonly CvEducation[];
  readonly skills: readonly CvSkill[];
  readonly certifications: readonly string[];
}

export type CvSourcePath =
  | "name"
  | "headline"
  | "location"
  | "availability"
  | "email"
  | "linkedin.label"
  | "linkedin.url"
  | "github.label"
  | "github.url"
  | "summary"
  | `experience[${number}].organisation`
  | `experience[${number}].role`
  | `experience[${number}].programme`
  | `experience[${number}].dates`
  | `experience[${number}].location`
  | `experience[${number}].bullets[${number}]`
  | `projects[${number}].name`
  | `projects[${number}].descriptor`
  | `projects[${number}].dates`
  | `projects[${number}].bullets[${number}]`
  | `education[${number}].institution`
  | `education[${number}].credential`
  | `education[${number}].dates`
  | `education[${number}].location`
  | `education[${number}].detail`
  | `skills[${number}].label`
  | `skills[${number}].value`
  | `certifications[${number}]`;

export interface ResumeFact<Path extends CvSourcePath = CvSourcePath> {
  readonly path: Path;
  readonly value: string;
  readonly sha256: string;
}

export interface ResumeLinkFacts<
  LabelPath extends "linkedin.label" | "github.label",
  UrlPath extends "linkedin.url" | "github.url",
> {
  readonly label: ResumeFact<LabelPath>;
  readonly url: ResumeFact<UrlPath>;
}

export interface ResumeExperienceView {
  readonly organisation: ResumeFact<`experience[${number}].organisation`>;
  readonly role: ResumeFact<`experience[${number}].role`>;
  readonly programme: ResumeFact<`experience[${number}].programme`>;
  readonly dates: ResumeFact<`experience[${number}].dates`>;
  readonly location: ResumeFact<`experience[${number}].location`>;
  readonly bullets: readonly ResumeFact<`experience[${number}].bullets[${number}]`>[];
}

export interface ResumeProjectView {
  readonly name: ResumeFact<`projects[${number}].name`>;
  readonly descriptor: ResumeFact<`projects[${number}].descriptor`>;
  readonly dates: ResumeFact<`projects[${number}].dates`>;
  readonly bullets: readonly ResumeFact<`projects[${number}].bullets[${number}]`>[];
}

export interface ResumeEducationView {
  readonly institution: ResumeFact<`education[${number}].institution`>;
  readonly credential: ResumeFact<`education[${number}].credential`>;
  readonly dates: ResumeFact<`education[${number}].dates`>;
  readonly location: ResumeFact<`education[${number}].location`>;
  readonly detail: ResumeFact<`education[${number}].detail`>;
}

export interface ResumeSkillView {
  readonly label: ResumeFact<`skills[${number}].label`>;
  readonly value: ResumeFact<`skills[${number}].value`>;
}

export interface ResumeViewModel {
  readonly identity: {
    readonly name: ResumeFact<"name">;
    readonly headline: ResumeFact<"headline">;
    readonly location: ResumeFact<"location">;
    readonly availability: ResumeFact<"availability">;
    readonly email: ResumeFact<"email">;
    readonly linkedin: ResumeLinkFacts<"linkedin.label", "linkedin.url">;
    readonly github: ResumeLinkFacts<"github.label", "github.url">;
    readonly summary: ResumeFact<"summary">;
  };
  readonly experience: readonly ResumeExperienceView[];
  readonly projects: readonly ResumeProjectView[];
  readonly education: readonly ResumeEducationView[];
  readonly skills: readonly ResumeSkillView[];
  readonly certifications: readonly ResumeFact<`certifications[${number}]`>[];
}

export interface ResumeProvenanceEntry {
  readonly route: "/resume/";
  readonly source_path: CvSourcePath;
  readonly source_value_sha256: string;
  readonly rendered_value_sha256: string;
}

export interface ResumeProvenanceManifest {
  readonly schema_version: "1.0.0";
  readonly route: "/resume/";
  readonly source_file: "content/source/cv.yaml";
  readonly source_file_sha256: string;
  readonly entries: readonly ResumeProvenanceEntry[];
}

export interface LoadedResume {
  readonly sourceFile: "content/source/cv.yaml";
  readonly sourceSha256: string;
  readonly document: CvDocument;
  readonly facts: readonly ResumeFact[];
  readonly view: ResumeViewModel;
  readonly provenance: ResumeProvenanceManifest;
  readonly fact: (path: CvSourcePath) => ResumeFact;
}

export interface PublicationConsent {
  readonly schema_version: "1.0.0";
  readonly contact_fields: "pending" | "approved";
}
