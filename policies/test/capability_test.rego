package portfolio.capability_test

import data.portfolio.capability.decision
import rego.v1

valid_read_input := {
	"schema_version": "1.0.0",
	"synthetic": true,
	"agent": {
		"id": "synthetic:maintenance-agent",
		"status": "active",
		"capabilities": ["fixture:read"],
	},
	"tool": {
		"id": "synthetic:fixture-catalog",
		"version": "1.0.0",
	},
	"action": "fixture:read",
	"resource": {
		"id": "synthetic-fixture:filter-unit-7",
		"classification": "synthetic_fixture",
	},
	"arguments_sha256": "0000000000000000000000000000000000000000000000000000000000000000",
}

valid_adjust_input := object.union(valid_read_input, {
	"action": "fixture:adjust",
})

unknown_action_input := object.union(valid_read_input, {
	"action": "fixture:archive",
})

cases := [
	{
		"name": "allowed synthetic read",
		"input": valid_read_input,
		"effect": "allow",
		"rule_id": "capability.fixture_read.allow",
		"action": "fixture:read",
		"required_capability": "fixture:read",
	},
	{
		"name": "missing adjustment capability",
		"input": valid_adjust_input,
		"effect": "deny",
		"rule_id": "capability.fixture_adjust.missing",
		"action": "fixture:adjust",
		"required_capability": "fixture:adjust",
	},
	{
		"name": "malformed input",
		"input": {"synthetic": true},
		"effect": "deny",
		"rule_id": "capability.input.invalid",
		"action": "fixture:read",
		"required_capability": "fixture:read",
	},
	{
		"name": "unknown action",
		"input": unknown_action_input,
		"effect": "deny",
		"rule_id": "capability.input.invalid",
		"action": "fixture:read",
		"required_capability": "fixture:read",
	},
]

test_capability_decision_cases if {
	every case in cases {
		result := decision with input as case.input
		result.effect == case.effect
		result.rule_id == case.rule_id
		result.action == case.action
		result.required_capability == case.required_capability
		is_string(result.reason)
		count(result.reason) > 0
		object.keys(result) == {
			"effect",
			"rule_id",
			"reason",
			"action",
			"required_capability",
		}
	}
}
