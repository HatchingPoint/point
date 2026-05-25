# Apple CLI toolkit (Point pattern)

General-purpose macOS build tooling via `capabilities process`. Not Apple-specific language syntax.

## Requirements

- macOS host with Xcode Command Line Tools or full Xcode
- `xcodebuild` and `xcrun simctl` on PATH

## Check

```bash
point check examples/toolkit/apple-cli.point
point launch examples/toolkit/apple-cli.point apple cli demo
```

## Notes

- Actions wrap host binaries through `std.process` — Point does not embed Xcode.
- Use `workflow print toolchain info` as a starting point for factory-style automation.
- Secrets and signing stay in env / host tooling, not in `.point` keywords.
