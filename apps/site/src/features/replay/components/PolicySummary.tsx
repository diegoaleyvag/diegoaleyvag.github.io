import type { PolicyRecord } from "@portfolio/contracts";

import { DECISION_LABELS, DECISION_MARKS, LAB_COPY } from "../copy";
import { shortenDigest } from "../format";
import { Mark } from "./Mark";

interface PolicySummaryProps {
  readonly policy: PolicyRecord;
}

export function PolicySummary({ policy }: PolicySummaryProps) {
  const { decision, input } = policy;

  return (
    <section class="policy-summary" aria-labelledby="policy-heading">
      <h3 id="policy-heading">{LAB_COPY.policyHeading}</h3>
      <p>
        <Mark
          tone={decision.effect}
          glyph={DECISION_MARKS[decision.effect]}
          label={DECISION_LABELS[decision.effect]}
        />
      </p>
      <dl>
        <dt>{LAB_COPY.policyRuleLabel}</dt>
        <dd class="mono">{decision.rule_id}</dd>
        <dt>{LAB_COPY.policyReasonLabel}</dt>
        <dd>{decision.reason}</dd>
        <dt>{LAB_COPY.policySourceLabel}</dt>
        <dd class="mono">{policy.source_path}</dd>
        <dt>{LAB_COPY.policyEntrypointLabel}</dt>
        <dd class="mono">{policy.entrypoint}</dd>
      </dl>

      <h4>{LAB_COPY.policyInputHeading}</h4>
      <dl>
        <dt>Agent</dt>
        <dd class="mono">
          {input.agent.id} ({input.agent.status})
        </dd>
        <dt>Capabilities</dt>
        <dd class="mono">{input.agent.capabilities.join(", ") || "none"}</dd>
        <dt>Tool</dt>
        <dd class="mono">
          {input.tool.id}@{input.tool.version}
        </dd>
        <dt>Action</dt>
        <dd class="mono">{input.action}</dd>
        <dt>Resource</dt>
        <dd class="mono">{input.resource.id}</dd>
        <dt>Arguments digest</dt>
        <dd
          class="mono"
          title={input.arguments_sha256}
          aria-label={input.arguments_sha256}
        >
          {shortenDigest(input.arguments_sha256)}
        </dd>
      </dl>

      <details>
        <summary>{LAB_COPY.rawPolicyJsonSummary}</summary>
        <pre class="raw-json">{JSON.stringify(policy, null, 2)}</pre>
      </details>
    </section>
  );
}
