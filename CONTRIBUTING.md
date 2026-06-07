# Contributing

Thanks for your interest in improving Cal bridge.

## Getting set up

See [docs/development.md](docs/development.md) for prerequisites (Node 24+, Yarn 4)
and the local development loop.

```bash
corepack enable
yarn install
```

## Before you open a pull request

Run the full gate locally — CI runs the same checks:

```bash
yarn lint
yarn twenty dev:typecheck
yarn tsc -p tsconfig.spec.json --noEmit
yarn test:unit
```

If you change webhook or upsert behaviour, add or update unit tests in
`src/logic-functions/cal-webhook.test.ts`. New entities (objects, fields, views,
functions) should be added with `yarn twenty dev:add <type>` so identifiers are
generated correctly.

## Guidelines

- Keep changes focused; one logical change per PR.
- Match the existing code style (TypeScript strict mode, no `any` leaking into
  logic).
- Update the relevant docs under [`docs/`](docs/) and add a [CHANGELOG](CHANGELOG.md)
  entry under "Unreleased".
- Don't commit secrets or `.env` files.

## Commit messages

Use clear, imperative summaries (e.g. "Add reschedule handling for new uids").
Conventional Commits are welcome but not required.

## Reporting bugs & security issues

- Functional bugs: open a GitHub issue with steps to reproduce.
- Security vulnerabilities: please email **hello@roekish.com** privately — see
  [docs/security.md](docs/security.md).
