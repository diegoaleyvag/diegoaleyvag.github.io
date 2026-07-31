# Deterministic replay builder

`corepack pnpm replays:build` reads the single checked-in synthetic scenario,
evaluates both finite variants with the verified OPA binary, validates each
`RunBundle`, and writes v1 static artifacts. No network, backend, secret,
provider, or wall clock is used.

The embedded policy source digest is SHA-256 over an RFC 8785 canonical object
containing the sorted relative path, exact byte length, and SHA-256 of:

1. `policies/source/capability.rego`
2. `policies/source/policy-data.json`

This binds the executable rules and their authored reasons. Bundle JSON is
pretty-printed with a trailing newline; the manifest records the byte length and
SHA-256 of those exact bytes.

`corepack pnpm generated:check` rebuilds all bytes in memory and compares them
to the committed directory without modifying it.
