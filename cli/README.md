leapp
=====

Command Line Interface for Leapp

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/leapp.svg)](https://npmjs.org/package/leapp)
[![Downloads/week](https://img.shields.io/npm/dw/leapp.svg)](https://npmjs.org/package/leapp)
[![License](https://img.shields.io/npm/l/leapp.svg)](https://github.com/agatim/leapp/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g leapp
$ leapp COMMAND
running command...
$ leapp (-v|--version|version)
leapp/0.0.0 darwin-x64 node-v14.17.0
$ leapp --help [COMMAND]
USAGE
  $ leapp COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`leapp hello [FILE]`](#leapp-hello-file)
* [`leapp help [COMMAND]`](#leapp-help-command)

## `leapp hello [FILE]`

describe the command here

```
USAGE
  $ leapp hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ leapp hello
  hello world from ./src/version.ts!
```

_See code: [src/commands/version.ts](https://github.com/agatim/leapp/blob/v0.0.0/src/commands/hello.ts)_

## `leapp help [COMMAND]`

display help for leapp

```
USAGE
  $ leapp help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.7/src/commands/help.ts)_
<!-- commandsstop -->
