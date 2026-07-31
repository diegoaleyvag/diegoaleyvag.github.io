import { loadPublicationConsent } from "@portfolio/resume";

const consent = await loadPublicationConsent();

if (consent.contact_fields !== "approved") {
  throw new Error(
    "Publication is blocked: content/publication-consent.yaml contact_fields must be owner-reviewed and set to approved",
  );
}

console.log("Publication consent is approved");
