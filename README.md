# semantic-release-go-monorepo

Apply semantic-release's automatic publishing to a monorepo of Go modules.

Heavily inspired by [sematic-release-monorepo](https://github.com/pmowrer/semantic-release-monorepo).

## Usage

`npx semantic-release-go-monorepo -b main`

**Note: You must have Node (>= 12) and Go (>= 1.14) installed.**

### Options

- `--dry-run`: Prints out new generated tags without actually creating them
- `--branches`, `-b`: Specify a list of branches to release from (see [below](#branches))
- `--ignore`, `-i`: Specify a list of folders or `go.mod` files to ignore. (`internal` and `vendor` folders are automatically ignored). This option can be passed multiple times.

#### Branches

You will most likely need to specify `--branches main` as a command line argument (now that GitHub's default branch name for new repos is "main"). This is due to an [upstream issue](https://github.com/semantic-release/semantic-release/issues/1581) with semantic-release. This tool does not automatically add it as a branch in order to be as transparent as possible.

## How does it work?

The Go Modules feature (marked as "ready for production use" in Go 1.14) allows a single repository to contain multiple separate modules, each versioned independently with a separate go.mod file. A couple examples of this in practice: [NewRelic's Go Agent](https://github.com/newrelic/go-agent) and the [AWS SDK v2](https://github.com/aws/aws-sdk-go-v2).

Each module in a repo uses a specific tag naming convention that mirrors the filesystem layout of the repository. For example, take the following repo contents:

```
repo/
  go.mod
  root.go
  a/
    a.go
    go.mod
  b/
    b.go
    go.mod
```

The module at the "root" of the repository would use a normal semantic versioning of tags (i.e. v1.0.0, v1.1.0, etc). The module in the `a/` folder would use the folder name as a prefix to the tag - `a/v1.0.0`, `a/v1.1.0`, etc.

This tool allows you to run the `semantic-release` process on every module in the repo, without any extra configuration or bash scripting. It follows these steps:

1. List all `go.mod` files in the repository (ones that aren't ignored by the `-i/--ignore` flag)
2. For each `go.mod` file, run `semantic-release` in the directory containing it. Semantic Release is configured to use the tag format matching the Go convention. Additionally, commits to the repo are filtered so that only commits affecting files within the given module are considered when determining a new release version.

## Caveats/Future Improvements

- This tool does not currently enforce Go's [Semantic Import Versioning](https://research.swtch.com/vgo-import) concept. If a major version is released based on commit messages, it currently does not check to make sure that the go mod import path contains the relevant major version component. In the future, a check will be added that will error & abort the release if a major version is detected without a commensurate change to the module path.
- Some advanced command line options/release configurations (i.e. additional plugins, plugin customization) supported by `semantic-release` may not work with this tool. Support for additional customization can be improved, however, so if you run into a use-case that doesn't work, please open an issue. 😄
