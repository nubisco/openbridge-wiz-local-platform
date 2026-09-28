# Contributing

## Getting set up

```sh
git clone https://github.com/nubisco/openbridge-wiz-local-platform
cd openbridge-wiz-local-platform
npm install
npm test
```

## Before opening a pull request

```sh
npm run quality:check
```

That runs tests, lint, formatting and the type check, and is the same gate CI
applies.

## Testing against real bulbs

The unit tests cover the conversions, the offline state machine and the
transport, and none of them need hardware. For a real bulb:

```sh
npm run build
node -e "
  const { WizClient } = require('./dist/protocol/WizClient.js')
  const c = new WizClient(3000)
  c.open().then(async () => {
    console.log(await c.getPilot('192.168.1.154'))
    c.close()
  })
"
```

## What to be careful about

**Do not add broadcast discovery.** It is the one thing this plugin exists to
avoid. If a convenience feature needs it, it belongs behind a flag that is off
by default, and it must never be the only way to find a bulb.

**Do not let an unreachable bulb report a value as current.** The separation
between the last known reading and whether the bulb is answering is the point
of the reachability tracking, and it is easy to undo by accident.

**Prefer measuring to assuming.** The behaviours worth knowing about these
bulbs, such as brightness having no zero and colour temperature being clamped,
were all found by asking a real bulb rather than reading a specification.

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/). Releases are cut
by semantic-release from the commit history, so the prefix decides the version:
`fix:` for a patch, `feat:` for a minor, and a `BREAKING CHANGE:` footer for a
major.
