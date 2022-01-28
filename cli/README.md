leapp
=================

Leapp's Command Line Interface.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@noovolari/leapp-core.svg)](https://npmjs.org/package/@noovolari/leapp-cli)
[![Downloads/week](https://img.shields.io/npm/dw/@noovolari/leapp-core.svg)](https://npmjs.org/package/@noovolari/leapp-cli)
[![License](https://img.shields.io/npm/l/@noovolari/leapp-core.svg)](https://github.com/Noovolari/leapp/package.json)
<!--[![CircleCI](https://circleci.com/gh/oclif/hello-world/tree/main.svg?style=shield)](https://circleci.com/gh/oclif/hello-world/tree/main)-->

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
$ leapp (--version)
leapp/0.1.0 darwin-x64 node-v16.13.1
$ leapp --help [COMMAND]
USAGE
  $ leapp COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`leapp help [COMMAND]`](#leapp-help-command)
* [`leapp plugins`](#leapp-plugins)
* [`leapp plugins:inspect PLUGIN...`](#leapp-pluginsinspect-plugin)
* [`leapp plugins:install PLUGIN...`](#leapp-pluginsinstall-plugin)
* [`leapp plugins:link PLUGIN`](#leapp-pluginslink-plugin)
* [`leapp plugins:uninstall PLUGIN...`](#leapp-pluginsuninstall-plugin)
* [`leapp plugins update`](#leapp-plugins-update)
* [`leapp session add`](#leapp-session-add)
* [`leapp session start`](#leapp-session-start)
* [`leapp session stop`](#leapp-session-stop)

## `leapp help [COMMAND]`

Display help for leapp.

```
USAGE
  $ leapp help [COMMAND] [-n]

ARGUMENTS
  COMMAND  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for leapp.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.1.10/src/commands/help.ts)_

## `leapp plugins`

List installed plugins.

```
USAGE
  $ leapp plugins [--core]

FLAGS
  --core  Show core plugins.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ leapp plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.0.12/src/commands/plugins/index.ts)_

## `leapp plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ leapp plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ leapp plugins:inspect myplugin
```

## `leapp plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ leapp plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.

  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.

ALIASES
  $ leapp plugins add

EXAMPLES
  $ leapp plugins:install myplugin 

  $ leapp plugins:install https://github.com/someuser/someplugin

  $ leapp plugins:install someuser/someplugin
```

## `leapp plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ leapp plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.

EXAMPLES
  $ leapp plugins:link myplugin
```

## `leapp plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ leapp plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ leapp plugins unlink
  $ leapp plugins remove
```

## `leapp plugins update`

Update installed plugins.

```
USAGE
  $ leapp plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

## `leapp session add`

Add a new session

```
USAGE
  $ leapp session add

DESCRIPTION
  Add a new session

EXAMPLES
  $leapp add
```

## `leapp session start`

Start a specific session

```
USAGE
  $ leapp session start -i <value>

FLAGS
  -i, --sessionId=<value>  (required) Session ID

DESCRIPTION
  Start a specific session

EXAMPLES
  $ oex start --sessionId 1234567890
```

## `leapp session stop`

Stop a specific session

```
USAGE
  $ leapp session stop -i <value>

FLAGS
  -i, --sessionId=<value>  (required) Session ID

DESCRIPTION
  Stop a specific session

EXAMPLES
  $ oex stop --sessionId 1234567890
```
<!-- commandsstop -->
