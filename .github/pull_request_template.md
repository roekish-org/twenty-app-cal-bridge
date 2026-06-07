<!--
Thanks for contributing to Cal bridge!
Keep PRs focused — one logical change per PR. See CONTRIBUTING.md.
Never include secrets (CAL_WEBHOOK_SECRET, API keys) in code, tests, or screenshots.
-->

## Summary

<!-- What does this change and why? -->

Closes #

## Type of change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds capability)
- [ ] Breaking change (schema or behaviour change that affects existing installs)
- [ ] Docs / wiki only
- [ ] Chore / tooling / CI

## Checklist

- [ ] `yarn lint` passes
- [ ] `yarn twenty dev:typecheck` passes
- [ ] `yarn tsc -p tsconfig.spec.json --noEmit` passes
- [ ] `yarn test:unit` passes (added/updated tests for behaviour changes)
- [ ] New entities were scaffolded with `yarn twenty dev:add <type>` (stable identifiers)
- [ ] Updated `CHANGELOG.md` under **Unreleased**
- [ ] Updated docs (`docs/` and the [wiki](https://github.com/roekish-org/twenty-app-cal-bridge/wiki)) if behaviour or config changed
- [ ] Bumped `version` in `package.json` if this is a release (semver)
- [ ] No secrets committed

## Notes for reviewers

<!-- Anything reviewers should focus on, trade-offs, follow-ups, screenshots, etc. -->
