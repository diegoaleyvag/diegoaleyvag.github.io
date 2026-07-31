# Pinned OPA CLI

`manifest.json` pins the official OPA release and SHA-256 digest for each
supported platform. The digests are the release-asset digests published by the
Open Policy Agent project.

Run `corepack pnpm opa:bootstrap` from the repository root. The TypeScript
bootstrap downloads only the selected official asset, verifies its bytes before
installation, and writes the executable beneath the ignored
`.cache/tools/opa/` directory. Policy and replay commands refuse to run if the
cached binary is missing or its digest differs from the manifest.
