# trello

CLI for Trello API interaction

[![Version](https://img.shields.io/npm/v/@hesed/trello.svg)](https://npmjs.org/package/@hesed/trello)
[![Downloads/week](https://img.shields.io/npm/dw/@hesed/trello.svg)](https://npmjs.org/package/@hesed/trello)

# Install

```bash
sdkck plugins install @hesed/trello
```

<!-- toc -->
* [trello](#trello)
* [Install](#install)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Usage

<!-- usage -->
```sh-session
$ npm install -g @hesed/trello
$ trello COMMAND
running command...
$ trello (--version)
@hesed/trello/0.5.2 linux-x64 node-v22.23.0
$ trello --help [COMMAND]
USAGE
  $ trello COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`trello trello auth add`](#trello-trello-auth-add)
* [`trello trello auth delete`](#trello-trello-auth-delete)
* [`trello trello auth list`](#trello-trello-auth-list)
* [`trello trello auth profile`](#trello-trello-auth-profile)
* [`trello trello auth test`](#trello-trello-auth-test)
* [`trello trello auth update`](#trello-trello-auth-update)
* [`trello trello board BOARDID`](#trello-trello-board-boardid)
* [`trello trello board cards BOARDID`](#trello-trello-board-cards-boardid)
* [`trello trello board list`](#trello-trello-board-list)
* [`trello trello board lists BOARDID`](#trello-trello-board-lists-boardid)
* [`trello trello board members BOARDID`](#trello-trello-board-members-boardid)
* [`trello trello card CARDID`](#trello-trello-card-cardid)
* [`trello trello card comments CARDID`](#trello-trello-card-comments-cardid)
* [`trello trello card create LISTID NAME`](#trello-trello-card-create-listid-name)
* [`trello trello card delete CARDID`](#trello-trello-card-delete-cardid)
* [`trello trello card move CARDID LISTID`](#trello-trello-card-move-cardid-listid)
* [`trello trello card search QUERY`](#trello-trello-card-search-query)
* [`trello trello card update CARDID`](#trello-trello-card-update-cardid)
* [`trello trello checklist CHECKLISTID`](#trello-trello-checklist-checklistid)
* [`trello trello checklist add-item CHECKLISTID NAME`](#trello-trello-checklist-add-item-checklistid-name)
* [`trello trello checklist create CARDID NAME`](#trello-trello-checklist-create-cardid-name)
* [`trello trello checklist delete CHECKLISTID`](#trello-trello-checklist-delete-checklistid)
* [`trello trello checklist delete-item CHECKLISTID CHECKITEMID`](#trello-trello-checklist-delete-item-checklistid-checkitemid)
* [`trello trello comment CARDID TEXT`](#trello-trello-comment-cardid-text)
* [`trello trello comment delete CARDID ACTIONID`](#trello-trello-comment-delete-cardid-actionid)
* [`trello trello comment update CARDID ACTIONID TEXT`](#trello-trello-comment-update-cardid-actionid-text)
* [`trello trello label BOARDID`](#trello-trello-label-boardid)
* [`trello trello label create BOARDID NAME COLOR`](#trello-trello-label-create-boardid-name-color)
* [`trello trello label delete LABELID`](#trello-trello-label-delete-labelid)
* [`trello trello list LISTID`](#trello-trello-list-listid)
* [`trello trello list archive LISTID`](#trello-trello-list-archive-listid)
* [`trello trello list cards LISTID`](#trello-trello-list-cards-listid)
* [`trello trello list create BOARDID NAME`](#trello-trello-list-create-boardid-name)
* [`trello trello member [MEMBERID]`](#trello-trello-member-memberid)

## `trello trello auth add`

Add Trello authentication

```
USAGE
  $ trello trello auth add -p <value> -k <value> -t <value> [--json]

FLAGS
  -k, --apiKey=<value>    (required) API key
  -p, --profile=<value>   (required) Profile name
  -t, --apiToken=<value>  (required) API token

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Add Trello authentication

EXAMPLES
  $ trello trello auth add

  $ trello trello auth add -p prod
```

_See code: [src/commands/trello/auth/add.ts](https://github.com/hesedcasa/trello/blob/v0.5.2/src/commands/trello/auth/add.ts)_

## `trello trello auth delete`

Delete an authentication profile

```
USAGE
  $ trello trello auth delete [--json] [-p <value>]

FLAGS
  -p, --profile=<value>  Profile to delete

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Delete an authentication profile

EXAMPLES
  $ trello trello auth delete

  $ trello trello auth delete -p prod
```

_See code: [src/commands/trello/auth/delete.ts](https://github.com/hesedcasa/trello/blob/v0.5.2/src/commands/trello/auth/delete.ts)_

## `trello trello auth list`

List authentication profiles

```
USAGE
  $ trello trello auth list [--json]

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List authentication profiles

EXAMPLES
  $ trello trello auth list
```

_See code: [src/commands/trello/auth/list.ts](https://github.com/hesedcasa/trello/blob/v0.5.2/src/commands/trello/auth/list.ts)_

## `trello trello auth profile`

Set or show the default authentication profile

```
USAGE
  $ trello trello auth profile [--json] [--default <value>]

FLAGS
  --default=<value>  Profile to set as default

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Set or show the default authentication profile

EXAMPLES
  $ trello trello auth profile

  $ trello trello auth profile --default test
```

_See code: [src/commands/trello/auth/profile.ts](https://github.com/hesedcasa/trello/blob/v0.5.2/src/commands/trello/auth/profile.ts)_

## `trello trello auth test`

Test authentication and connection

```
USAGE
  $ trello trello auth test [--json] [-p <value>]

FLAGS
  -p, --profile=<value>  Authentication profile name

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Test authentication and connection

EXAMPLES
  $ trello trello auth test

  $ trello trello auth test -p prod
```

_See code: [src/commands/trello/auth/test.ts](https://github.com/hesedcasa/trello/blob/v0.5.2/src/commands/trello/auth/test.ts)_

## `trello trello auth update`

Update Trello authentication

```
USAGE
  $ trello trello auth update -p <value> -k <value> -t <value> [--json]

FLAGS
  -k, --apiKey=<value>    (required) API key
  -p, --profile=<value>   (required) Profile name
  -t, --apiToken=<value>  (required) API token

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Update Trello authentication

EXAMPLES
  $ trello trello auth update

  $ trello trello auth update -p test
```

_See code: [src/commands/trello/auth/update.ts](https://github.com/hesedcasa/trello/blob/v0.5.2/src/commands/trello/auth/update.ts)_

## `trello trello board BOARDID`

Get details of a specific board

```
USAGE
  $ trello trello board BOARDID [-p <value>] [--toon]

ARGUMENTS
  BOARDID  Board ID

FLAGS
  -p, --profile=<value>  Authentication profile name
      --toon             Format output as toon

DESCRIPTION
  Get details of a specific board

EXAMPLES
  $ trello trello board 5a1b2c3d4e5f6g7h8i9j
```

_See code: [src/commands/trello/board/index.ts](https://github.com/hesedcasa/trello/blob/v0.5.2/src/commands/trello/board/index.ts)_

## `trello trello board cards BOARDID`

Get all cards on a board

```
USAGE
  $ trello trello board cards BOARDID [--filter <value>] [-p <value>] [--toon]

ARGUMENTS
  BOARDID  Board ID

FLAGS
  -p, --profile=<value>  Authentication profile name
      --filter=<value>   Filter cards (all, closed, none, open, visible)
      --toon             Format output as toon

DESCRIPTION
  Get all cards on a board

EXAMPLES
  $ trello trello board cards 5a1b2c3d
```

_See code: [src/commands/trello/board/cards.ts](https://github.com/hesedcasa/trello/blob/v0.5.2/src/commands/trello/board/cards.ts)_

## `trello trello board list`

List all boards for the authenticated member

```
USAGE
  $ trello trello board list [--filter all|closed|members|open|organization|public|starred] [-p <value>] [--toon]

FLAGS
  -p, --profile=<value>  Authentication profile name
      --filter=<option>  [default: open] Filter boards by status
                         <options: all|closed|members|open|organization|public|starred>
      --toon             Format output as toon

DESCRIPTION
  List all boards for the authenticated member

EXAMPLES
  $ trello trello board list
```

_See code: [src/commands/trello/board/list.ts](https://github.com/hesedcasa/trello/blob/v0.5.2/src/commands/trello/board/list.ts)_

## `trello trello board lists BOARDID`

Get all lists on a board

```
USAGE
  $ trello trello board lists BOARDID [-p <value>] [--toon]

ARGUMENTS
  BOARDID  Board ID

FLAGS
  -p, --profile=<value>  Authentication profile name
      --toon             Format output as toon

DESCRIPTION
  Get all lists on a board

EXAMPLES
  $ trello trello board lists 5a1b2c3d4e5f6g7h8i9j
```

_See code: [src/commands/trello/board/lists.ts](https://github.com/hesedcasa/trello/blob/v0.5.2/src/commands/trello/board/lists.ts)_

## `trello trello board members BOARDID`

Get all members of a board

```
USAGE
  $ trello trello board members BOARDID [-p <value>] [--toon]

ARGUMENTS
  BOARDID  Board ID

FLAGS
  -p, --profile=<value>  Authentication profile name
      --toon             Format output as toon

DESCRIPTION
  Get all members of a board

EXAMPLES
  $ trello trello board members 5a1b2c3d
```

_See code: [src/commands/trello/board/members.ts](https://github.com/hesedcasa/trello/blob/v0.5.2/src/commands/trello/board/members.ts)_

## `trello trello card CARDID`

Get details of a specific card

```
USAGE
  $ trello trello card CARDID [-p <value>] [--toon]

ARGUMENTS
  CARDID  Card ID

FLAGS
  -p, --profile=<value>  Authentication profile name
      --toon             Format output as toon

DESCRIPTION
  Get details of a specific card

EXAMPLES
  $ trello trello card 5a1b2c3d
```

_See code: [src/commands/trello/card/index.ts](https://github.com/hesedcasa/trello/blob/v0.5.2/src/commands/trello/card/index.ts)_

## `trello trello card comments CARDID`

Get comments on a card

```
USAGE
  $ trello trello card comments CARDID [-p <value>] [--toon]

ARGUMENTS
  CARDID  Card ID

FLAGS
  -p, --profile=<value>  Authentication profile name
      --toon             Format output as toon

DESCRIPTION
  Get comments on a card

EXAMPLES
  $ trello trello card comments 5a1b2c3d
```

_See code: [src/commands/trello/card/comments.ts](https://github.com/hesedcasa/trello/blob/v0.5.2/src/commands/trello/card/comments.ts)_

## `trello trello card create LISTID NAME`

Create a new card

```
USAGE
  $ trello trello card create LISTID NAME [--desc <value>] [--pos top|bottom] [-p <value>] [--toon]

ARGUMENTS
  LISTID  List ID to add the card to
  NAME    Card name

FLAGS
  -p, --profile=<value>  Authentication profile name
      --desc=<value>     Card description
      --pos=<option>     Position of the card (top, bottom)
                         <options: top|bottom>
      --toon             Format output as toon

DESCRIPTION
  Create a new card

EXAMPLES
  $ trello trello card create 5a1b2c3d "My new card"

  $ trello trello card create 5a1b2c3d "My new card" --desc "Card description" --pos top
```

_See code: [src/commands/trello/card/create.ts](https://github.com/hesedcasa/trello/blob/v0.5.2/src/commands/trello/card/create.ts)_

## `trello trello card delete CARDID`

Delete a card

```
USAGE
  $ trello trello card delete CARDID [-p <value>]

ARGUMENTS
  CARDID  Card ID

FLAGS
  -p, --profile=<value>  Authentication profile name

DESCRIPTION
  Delete a card

EXAMPLES
  $ trello trello card delete 5a1b2c3d
```

_See code: [src/commands/trello/card/delete.ts](https://github.com/hesedcasa/trello/blob/v0.5.2/src/commands/trello/card/delete.ts)_

## `trello trello card move CARDID LISTID`

Move a card to a different list

```
USAGE
  $ trello trello card move CARDID LISTID [--board <value>] [-p <value>] [--toon]

ARGUMENTS
  CARDID  Card ID
  LISTID  Target list ID

FLAGS
  -p, --profile=<value>  Authentication profile name
      --board=<value>    Target board ID (for cross-board moves)
      --toon             Format output as toon

DESCRIPTION
  Move a card to a different list

EXAMPLES
  $ trello trello card move cardId123 listId456

  $ trello trello card move cardId123 listId456 --board boardId789
```

_See code: [src/commands/trello/card/move.ts](https://github.com/hesedcasa/trello/blob/v0.5.2/src/commands/trello/card/move.ts)_

## `trello trello card search QUERY`

Search for cards

```
USAGE
  $ trello trello card search QUERY [--boards <value>] [-p <value>] [--toon]

ARGUMENTS
  QUERY  Search query

FLAGS
  -p, --profile=<value>  Authentication profile name
      --boards=<value>   Comma-separated board IDs to search within
      --toon             Format output as toon

DESCRIPTION
  Search for cards

EXAMPLES
  $ trello trello card search "bug fix"

  $ trello trello card search "bug fix" --boards boardId1,boardId2
```

_See code: [src/commands/trello/card/search.ts](https://github.com/hesedcasa/trello/blob/v0.5.2/src/commands/trello/card/search.ts)_

## `trello trello card update CARDID`

Update an existing card

```
USAGE
  $ trello trello card update CARDID --fields <value>... [-p <value>] [--toon]

ARGUMENTS
  CARDID  Card ID

FLAGS
  -p, --profile=<value>    Authentication profile name
      --fields=<value>...  (required) Card fields to update in key=value format
      --toon               Format output as toon

DESCRIPTION
  Update an existing card

EXAMPLES
  $ trello trello card update 5a1b2c3d --fields name="Updated name" desc="New description"
```

_See code: [src/commands/trello/card/update.ts](https://github.com/hesedcasa/trello/blob/v0.5.2/src/commands/trello/card/update.ts)_

## `trello trello checklist CHECKLISTID`

Get details of a specific checklist

```
USAGE
  $ trello trello checklist CHECKLISTID [-p <value>] [--toon]

ARGUMENTS
  CHECKLISTID  Checklist ID

FLAGS
  -p, --profile=<value>  Authentication profile name
      --toon             Format output as toon

DESCRIPTION
  Get details of a specific checklist

EXAMPLES
  $ trello trello checklist 5a1b2c3d
```

_See code: [src/commands/trello/checklist/index.ts](https://github.com/hesedcasa/trello/blob/v0.5.2/src/commands/trello/checklist/index.ts)_

## `trello trello checklist add-item CHECKLISTID NAME`

Add an item to a checklist

```
USAGE
  $ trello trello checklist add-item CHECKLISTID NAME [-p <value>] [--toon]

ARGUMENTS
  CHECKLISTID  Checklist ID
  NAME         Check item name

FLAGS
  -p, --profile=<value>  Authentication profile name
      --toon             Format output as toon

DESCRIPTION
  Add an item to a checklist

EXAMPLES
  $ trello trello checklist add-item checklistId123 "Buy groceries"
```

_See code: [src/commands/trello/checklist/add-item.ts](https://github.com/hesedcasa/trello/blob/v0.5.2/src/commands/trello/checklist/add-item.ts)_

## `trello trello checklist create CARDID NAME`

Create a new checklist on a card

```
USAGE
  $ trello trello checklist create CARDID NAME [-p <value>] [--toon]

ARGUMENTS
  CARDID  Card ID
  NAME    Checklist name

FLAGS
  -p, --profile=<value>  Authentication profile name
      --toon             Format output as toon

DESCRIPTION
  Create a new checklist on a card

EXAMPLES
  $ trello trello checklist create cardId123 "My Checklist"
```

_See code: [src/commands/trello/checklist/create.ts](https://github.com/hesedcasa/trello/blob/v0.5.2/src/commands/trello/checklist/create.ts)_

## `trello trello checklist delete CHECKLISTID`

Delete a checklist

```
USAGE
  $ trello trello checklist delete CHECKLISTID [-p <value>]

ARGUMENTS
  CHECKLISTID  Checklist ID

FLAGS
  -p, --profile=<value>  Authentication profile name

DESCRIPTION
  Delete a checklist

EXAMPLES
  $ trello trello checklist delete 5a1b2c3d
```

_See code: [src/commands/trello/checklist/delete.ts](https://github.com/hesedcasa/trello/blob/v0.5.2/src/commands/trello/checklist/delete.ts)_

## `trello trello checklist delete-item CHECKLISTID CHECKITEMID`

Delete an item from a checklist

```
USAGE
  $ trello trello checklist delete-item CHECKLISTID CHECKITEMID [-p <value>]

ARGUMENTS
  CHECKLISTID  Checklist ID
  CHECKITEMID  Check item ID

FLAGS
  -p, --profile=<value>  Authentication profile name

DESCRIPTION
  Delete an item from a checklist

EXAMPLES
  $ trello trello checklist delete-item checklistId123 itemId456
```

_See code: [src/commands/trello/checklist/delete-item.ts](https://github.com/hesedcasa/trello/blob/v0.5.2/src/commands/trello/checklist/delete-item.ts)_

## `trello trello comment CARDID TEXT`

Add a comment to a card

```
USAGE
  $ trello trello comment CARDID TEXT [-p <value>] [--toon]

ARGUMENTS
  CARDID  Card ID
  TEXT    Comment text

FLAGS
  -p, --profile=<value>  Authentication profile name
      --toon             Format output as toon

DESCRIPTION
  Add a comment to a card

EXAMPLES
  $ trello trello comment cardId123 "This is a comment"

  $ trello trello comment cardId123 "**Bold** _italic_ ~~strikethrough~~"

  $ trello trello comment cardId123 "- Item 1
  - Item 2
  - Item 3"

  $ trello trello comment cardId123 "Check [this](https://example.com) link"
```

_See code: [src/commands/trello/comment/index.ts](https://github.com/hesedcasa/trello/blob/v0.5.2/src/commands/trello/comment/index.ts)_

## `trello trello comment delete CARDID ACTIONID`

Delete a comment from a card

```
USAGE
  $ trello trello comment delete CARDID ACTIONID [-p <value>]

ARGUMENTS
  CARDID    Card ID
  ACTIONID  Comment action ID

FLAGS
  -p, --profile=<value>  Authentication profile name

DESCRIPTION
  Delete a comment from a card

EXAMPLES
  $ trello trello comment delete cardId123 actionId456
```

_See code: [src/commands/trello/comment/delete.ts](https://github.com/hesedcasa/trello/blob/v0.5.2/src/commands/trello/comment/delete.ts)_

## `trello trello comment update CARDID ACTIONID TEXT`

Update a comment on a card

```
USAGE
  $ trello trello comment update CARDID ACTIONID TEXT [-p <value>] [--toon]

ARGUMENTS
  CARDID    Card ID
  ACTIONID  Comment action ID
  TEXT      Updated comment text

FLAGS
  -p, --profile=<value>  Authentication profile name
      --toon             Format output as toon

DESCRIPTION
  Update a comment on a card

EXAMPLES
  $ trello trello comment update cardId123 actionId456 "Updated comment"

  $ trello trello comment update cardId123 actionId456 "**Bold** _italic_ ~~strikethrough~~"

  $ trello trello comment update cardId123 actionId456 "- Item 1
  - Item 2
  - Item 3"

  $ trello trello comment update cardId123 actionId456 "Check [this](https://example.com) link"
```

_See code: [src/commands/trello/comment/update.ts](https://github.com/hesedcasa/trello/blob/v0.5.2/src/commands/trello/comment/update.ts)_

## `trello trello label BOARDID`

List all labels on a board

```
USAGE
  $ trello trello label BOARDID [-p <value>] [--toon]

ARGUMENTS
  BOARDID  Board ID

FLAGS
  -p, --profile=<value>  Authentication profile name
      --toon             Format output as toon

DESCRIPTION
  List all labels on a board

EXAMPLES
  $ trello trello label 5a1b2c3d
```

_See code: [src/commands/trello/label/index.ts](https://github.com/hesedcasa/trello/blob/v0.5.2/src/commands/trello/label/index.ts)_

## `trello trello label create BOARDID NAME COLOR`

Create a new label on a board

```
USAGE
  $ trello trello label create BOARDID NAME COLOR [-p <value>] [--toon]

ARGUMENTS
  BOARDID  Board ID
  NAME     Label name
  COLOR    (blue|green|orange|red|yellow|purple|pink|sky|lime|black) Label color

FLAGS
  -p, --profile=<value>  Authentication profile name
      --toon             Format output as toon

DESCRIPTION
  Create a new label on a board

EXAMPLES
  $ trello trello label create 5a1b2c3d "Bug" red
```

_See code: [src/commands/trello/label/create.ts](https://github.com/hesedcasa/trello/blob/v0.5.2/src/commands/trello/label/create.ts)_

## `trello trello label delete LABELID`

Delete a label

```
USAGE
  $ trello trello label delete LABELID [-p <value>]

ARGUMENTS
  LABELID  Label ID

FLAGS
  -p, --profile=<value>  Authentication profile name

DESCRIPTION
  Delete a label

EXAMPLES
  $ trello trello label delete 5a1b2c3d
```

_See code: [src/commands/trello/label/delete.ts](https://github.com/hesedcasa/trello/blob/v0.5.2/src/commands/trello/label/delete.ts)_

## `trello trello list LISTID`

Get details of a specific list

```
USAGE
  $ trello trello list LISTID [-p <value>] [--toon]

ARGUMENTS
  LISTID  List ID

FLAGS
  -p, --profile=<value>  Authentication profile name
      --toon             Format output as toon

DESCRIPTION
  Get details of a specific list

EXAMPLES
  $ trello trello list 5a1b2c3d
```

_See code: [src/commands/trello/list/index.ts](https://github.com/hesedcasa/trello/blob/v0.5.2/src/commands/trello/list/index.ts)_

## `trello trello list archive LISTID`

Archive a list or all cards in a list

```
USAGE
  $ trello trello list archive LISTID [--cards-only] [-p <value>]

ARGUMENTS
  LISTID  List ID

FLAGS
  -p, --profile=<value>  Authentication profile name
      --cards-only       Only archive cards in the list, not the list itself

DESCRIPTION
  Archive a list or all cards in a list

EXAMPLES
  $ trello trello list archive 5a1b2c3d

  $ trello trello list archive 5a1b2c3d --cards-only
```

_See code: [src/commands/trello/list/archive.ts](https://github.com/hesedcasa/trello/blob/v0.5.2/src/commands/trello/list/archive.ts)_

## `trello trello list cards LISTID`

Get all cards in a list

```
USAGE
  $ trello trello list cards LISTID [-p <value>] [--toon]

ARGUMENTS
  LISTID  List ID

FLAGS
  -p, --profile=<value>  Authentication profile name
      --toon             Format output as toon

DESCRIPTION
  Get all cards in a list

EXAMPLES
  $ trello trello list cards 5a1b2c3d
```

_See code: [src/commands/trello/list/cards.ts](https://github.com/hesedcasa/trello/blob/v0.5.2/src/commands/trello/list/cards.ts)_

## `trello trello list create BOARDID NAME`

Create a new list on a board

```
USAGE
  $ trello trello list create BOARDID NAME [--pos top|bottom] [-p <value>] [--toon]

ARGUMENTS
  BOARDID  Board ID
  NAME     List name

FLAGS
  -p, --profile=<value>  Authentication profile name
      --pos=<option>     Position of the list (top, bottom)
                         <options: top|bottom>
      --toon             Format output as toon

DESCRIPTION
  Create a new list on a board

EXAMPLES
  $ trello trello list create 5a1b2c3d "To Do"

  $ trello trello list create 5a1b2c3d "Done" --pos bottom
```

_See code: [src/commands/trello/list/create.ts](https://github.com/hesedcasa/trello/blob/v0.5.2/src/commands/trello/list/create.ts)_

## `trello trello member [MEMBERID]`

Get member details

```
USAGE
  $ trello trello member [MEMBERID] [-p <value>] [--toon]

ARGUMENTS
  [MEMBERID]  [default: me] Member ID or username (defaults to "me")

FLAGS
  -p, --profile=<value>  Authentication profile name
      --toon             Format output as toon

DESCRIPTION
  Get member details

EXAMPLES
  $ trello trello member

  $ trello trello member me

  $ trello trello member johndoe
```

_See code: [src/commands/trello/member/index.ts](https://github.com/hesedcasa/trello/blob/v0.5.2/src/commands/trello/member/index.ts)_
<!-- commandsstop -->
