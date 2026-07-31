package portfolio.capability

import rego.v1

valid_input if {
	input.schema_version == "1.0.0"
	input.synthetic == true
	is_object(input.agent)
	is_string(input.agent.id)
	regex.match("^synthetic:[a-z0-9][a-z0-9-]*$", input.agent.id)
	input.agent.status in {"active", "suspended", "revoked"}
	is_array(input.agent.capabilities)
	every capability in input.agent.capabilities {
		capability in {"fixture:read", "fixture:adjust"}
	}
	is_object(input.tool)
	is_string(input.tool.id)
	regex.match("^synthetic:[a-z0-9][a-z0-9-]*$", input.tool.id)
	is_string(input.tool.version)
	regex.match("^\\d+\\.\\d+\\.\\d+$", input.tool.version)
	is_string(input.action)
	data.portfolio.capability.actions[input.action]
	is_object(input.resource)
	is_string(input.resource.id)
	regex.match("^synthetic-fixture:[a-z0-9-]+$", input.resource.id)
	input.resource.classification == "synthetic_fixture"
	is_string(input.arguments_sha256)
	regex.match("^[a-f0-9]{64}$", input.arguments_sha256)
}

has_required_capability if {
	action := data.portfolio.capability.actions[input.action]
	action.required_capability in input.agent.capabilities
}

decision := invalid_decision if {
	not valid_input
}

decision := inactive_decision if {
	valid_input
	input.agent.status != "active"
}

decision := allow_decision if {
	valid_input
	input.agent.status == "active"
	has_required_capability
}

decision := missing_capability_decision if {
	valid_input
	input.agent.status == "active"
	not has_required_capability
}

invalid_decision := {
	"effect": "deny",
	"rule_id": data.portfolio.capability.fallback.invalid_rule_id,
	"reason": data.portfolio.capability.fallback.invalid_reason,
	"action": data.portfolio.capability.fallback.action,
	"required_capability": data.portfolio.capability.fallback.required_capability,
}

inactive_decision := {
	"effect": "deny",
	"rule_id": data.portfolio.capability.fallback.inactive_rule_id,
	"reason": data.portfolio.capability.fallback.inactive_reason,
	"action": input.action,
	"required_capability": data.portfolio.capability.actions[input.action].required_capability,
}

allow_decision := {
	"effect": "allow",
	"rule_id": data.portfolio.capability.actions[input.action].allow_rule_id,
	"reason": data.portfolio.capability.actions[input.action].allow_reason,
	"action": input.action,
	"required_capability": data.portfolio.capability.actions[input.action].required_capability,
}

missing_capability_decision := {
	"effect": "deny",
	"rule_id": data.portfolio.capability.actions[input.action].deny_rule_id,
	"reason": data.portfolio.capability.actions[input.action].deny_reason,
	"action": input.action,
	"required_capability": data.portfolio.capability.actions[input.action].required_capability,
}
