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
@hesed/trello/0.1.0 darwin-arm64 node-v22.14.0
$ trello --help [COMMAND]
USAGE
  $ trello COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`trello trello auth add`](#trello-trello-auth-add)
* [`trello trello auth test`](#trello-trello-auth-test)
* [`trello trello auth update`](#trello-trello-auth-update)
* [`trello trello board cards BOARDID`](#trello-trello-board-cards-boardid)
* [`trello trello board get BOARDID`](#trello-trello-board-get-boardid)
* [`trello trello board list`](#trello-trello-board-list)
* [`trello trello board lists BOARDID`](#trello-trello-board-lists-boardid)
* [`trello trello board members BOARDID`](#trello-trello-board-members-boardid)
* [`trello trello card comments CARDID`](#trello-trello-card-comments-cardid)
* [`trello trello card create LISTID NAME`](#trello-trello-card-create-listid-name)
* [`trello trello card delete CARDID`](#trello-trello-card-delete-cardid)
* [`trello trello card get CARDID`](#trello-trello-card-get-cardid)
* [`trello trello card move CARDID LISTID`](#trello-trello-card-move-cardid-listid)
* [`trello trello card search QUERY`](#trello-trello-card-search-query)
* [`trello trello card update CARDID`](#trello-trello-card-update-cardid)
* [`trello trello checklist add-item CHECKLISTID NAME`](#trello-trello-checklist-add-item-checklistid-name)
* [`trello trello checklist create CARDID NAME`](#trello-trello-checklist-create-cardid-name)
* [`trello trello checklist delete CHECKLISTID`](#trello-trello-checklist-delete-checklistid)
* [`trello trello checklist delete-item CHECKLISTID CHECKITEMID`](#trello-trello-checklist-delete-item-checklistid-checkitemid)
* [`trello trello checklist get CHECKLISTID`](#trello-trello-checklist-get-checklistid)
* [`trello trello comment add CARDID TEXT`](#trello-trello-comment-add-cardid-text)
* [`trello trello comment delete CARDID ACTIONID`](#trello-trello-comment-delete-cardid-actionid)
* [`trello trello comment update CARDID ACTIONID TEXT`](#trello-trello-comment-update-cardid-actionid-text)
* [`trello trello label create BOARDID NAME COLOR`](#trello-trello-label-create-boardid-name-color)
* [`trello trello label delete LABELID`](#trello-trello-label-delete-labelid)
* [`trello trello label list BOARDID`](#trello-trello-label-list-boardid)
* [`trello trello list archive LISTID`](#trello-trello-list-archive-listid)
* [`trello trello list cards LISTID`](#trello-trello-list-cards-listid)
* [`trello trello list create BOARDID NAME`](#trello-trello-list-create-boardid-name)
* [`trello trello list get LISTID`](#trello-trello-list-get-listid)
* [`trello trello member get [MEMBERID]`](#trello-trello-member-get-memberid)

## `trello trello auth add`

Add Trello authentication

```
USAGE
  $ trello trello auth add [--json] [-k <value>] [-t <value>]

FLAGS
  -k, --key=<value>    Trello API key
  -t, --token=<value>  Trello API token

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Add Trello authentication

EXAMPLES
  $ trello trello auth add
```

_See code: [src/commands/trello/auth/add.ts](https://github.com/hesedcasa/trello/blob/v0.1.0/src/commands/trello/auth/add.ts)_

## `trello trello auth test`

Test authentication and connection

```
USAGE
  $ trello trello auth test [--json]

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Test authentication and connection

EXAMPLES
  $ trello trello auth test
```

_See code: [src/commands/trello/auth/test.ts](https://github.com/hesedcasa/trello/blob/v0.1.0/src/commands/trello/auth/test.ts)_

## `trello trello auth update`

Update existing authentication

```
USAGE
  $ trello trello auth update [--json] [-k <value>] [-t <value>]

FLAGS
  -k, --key=<value>    Trello API key
  -t, --token=<value>  Trello API token

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Update existing authentication

EXAMPLES
  $ trello trello auth update
```

_See code: [src/commands/trello/auth/update.ts](https://github.com/hesedcasa/trello/blob/v0.1.0/src/commands/trello/auth/update.ts)_

## `trello trello board cards BOARDID`

Get all cards on a board

```
USAGE
  $ trello trello board cards BOARDID [--filter <value>] [--toon]

ARGUMENTS
  BOARDID  Board ID

FLAGS
  --filter=<value>  Filter cards (all, closed, none, open, visible)
  --toon            Format output as toon

DESCRIPTION
  Get all cards on a board

EXAMPLES
  $ trello trello board cards 5a1b2c3d
```

_See code: [src/commands/trello/board/cards.ts](https://github.com/hesedcasa/trello/blob/v0.1.0/src/commands/trello/board/cards.ts)_

## `trello trello board get BOARDID`

Get details of a specific board

```
USAGE
  $ trello trello board get BOARDID [--toon]

ARGUMENTS
  BOARDID  Board ID

FLAGS
  --toon  Format output as toon

DESCRIPTION
  Get details of a specific board

EXAMPLES
  $ trello trello board get 5a1b2c3d4e5f6g7h8i9j
```

_See code: [src/commands/trello/board/get.ts](https://github.com/hesedcasa/trello/blob/v0.1.0/src/commands/trello/board/get.ts)_

## `trello trello board list`

List all boards for the authenticated member

```
USAGE
  $ trello trello board list [--toon]

FLAGS
  --toon  Format output as toon

DESCRIPTION
  List all boards for the authenticated member

EXAMPLES
  $ trello trello board list
```

_See code: [src/commands/trello/board/list.ts](https://github.com/hesedcasa/trello/blob/v0.1.0/src/commands/trello/board/list.ts)_

## `trello trello board lists BOARDID`

Get all lists on a board

```
USAGE
  $ trello trello board lists BOARDID [--toon]

ARGUMENTS
  BOARDID  Board ID

FLAGS
  --toon  Format output as toon

DESCRIPTION
  Get all lists on a board

EXAMPLES
  $ trello trello board lists 5a1b2c3d4e5f6g7h8i9j
```

_See code: [src/commands/trello/board/lists.ts](https://github.com/hesedcasa/trello/blob/v0.1.0/src/commands/trello/board/lists.ts)_

## `trello trello board members BOARDID`

Get all members of a board

```
USAGE
  $ trello trello board members BOARDID [--toon]

ARGUMENTS
  BOARDID  Board ID

FLAGS
  --toon  Format output as toon

DESCRIPTION
  Get all members of a board

EXAMPLES
  $ trello trello board members 5a1b2c3d
```

_See code: [src/commands/trello/board/members.ts](https://github.com/hesedcasa/trello/blob/v0.1.0/src/commands/trello/board/members.ts)_

## `trello trello card comments CARDID`

Get comments on a card

```
USAGE
  $ trello trello card comments CARDID [--toon]

ARGUMENTS
  CARDID  Card ID

FLAGS
  --toon  Format output as toon

DESCRIPTION
  Get comments on a card

EXAMPLES
  $ trello trello card comments 5a1b2c3d
```

_See code: [src/commands/trello/card/comments.ts](https://github.com/hesedcasa/trello/blob/v0.1.0/src/commands/trello/card/comments.ts)_

## `trello trello card create LISTID NAME`

Create a new card

```
USAGE
  $ trello trello card create LISTID NAME [--desc <value>] [--pos top|bottom] [--toon]

ARGUMENTS
  LISTID  List ID to add the card to
  NAME    Card name

FLAGS
  --desc=<value>  Card description
  --pos=<option>  Position of the card (top, bottom)
                  <options: top|bottom>
  --toon          Format output as toon

DESCRIPTION
  Create a new card

EXAMPLES
  $ trello trello card create 5a1b2c3d "My new card"

  $ trello trello card create 5a1b2c3d "My new card" --desc "Card description" --pos top
```

_See code: [src/commands/trello/card/create.ts](https://github.com/hesedcasa/trello/blob/v0.1.0/src/commands/trello/card/create.ts)_

## `trello trello card delete CARDID`

Delete a card

```
USAGE
  $ trello trello card delete CARDID

ARGUMENTS
  CARDID  Card ID

DESCRIPTION
  Delete a card

EXAMPLES
  $ trello trello card delete 5a1b2c3d
```

_See code: [src/commands/trello/card/delete.ts](https://github.com/hesedcasa/trello/blob/v0.1.0/src/commands/trello/card/delete.ts)_

## `trello trello card get CARDID`

Get details of a specific card

```
USAGE
  $ trello trello card get CARDID [--toon]

ARGUMENTS
  CARDID  Card ID

FLAGS
  --toon  Format output as toon

DESCRIPTION
  Get details of a specific card

EXAMPLES
  $ trello trello card get 5a1b2c3d
```

_See code: [src/commands/trello/card/get.ts](https://github.com/hesedcasa/trello/blob/v0.1.0/src/commands/trello/card/get.ts)_

## `trello trello card move CARDID LISTID`

Move a card to a different list

```
USAGE
  $ trello trello card move CARDID LISTID [--board <value>] [--toon]

ARGUMENTS
  CARDID  Card ID
  LISTID  Target list ID

FLAGS
  --board=<value>  Target board ID (for cross-board moves)
  --toon           Format output as toon

DESCRIPTION
  Move a card to a different list

EXAMPLES
  $ trello trello card move cardId123 listId456

  $ trello trello card move cardId123 listId456 --board boardId789
```

_See code: [src/commands/trello/card/move.ts](https://github.com/hesedcasa/trello/blob/v0.1.0/src/commands/trello/card/move.ts)_

## `trello trello card search QUERY`

Search for cards

```
USAGE
  $ trello trello card search QUERY [--boards <value>] [--toon]

ARGUMENTS
  QUERY  Search query

FLAGS
  --boards=<value>  Comma-separated board IDs to search within
  --toon            Format output as toon

DESCRIPTION
  Search for cards

EXAMPLES
  $ trello trello card search "bug fix"

  $ trello trello card search "bug fix" --boards boardId1,boardId2
```

_See code: [src/commands/trello/card/search.ts](https://github.com/hesedcasa/trello/blob/v0.1.0/src/commands/trello/card/search.ts)_

## `trello trello card update CARDID`

Update an existing card

```
USAGE
  $ trello trello card update CARDID --fields <value>... [--toon]

ARGUMENTS
  CARDID  Card ID

FLAGS
  --fields=<value>...  (required) Card fields to update in key=value format
  --toon               Format output as toon

DESCRIPTION
  Update an existing card

EXAMPLES
  $ trello trello card update 5a1b2c3d --fields name="Updated name" desc="New description"
```

_See code: [src/commands/trello/card/update.ts](https://github.com/hesedcasa/trello/blob/v0.1.0/src/commands/trello/card/update.ts)_

## `trello trello checklist add-item CHECKLISTID NAME`

Add an item to a checklist

```
USAGE
  $ trello trello checklist add-item CHECKLISTID NAME [--toon]

ARGUMENTS
  CHECKLISTID  Checklist ID
  NAME         Check item name

FLAGS
  --toon  Format output as toon

DESCRIPTION
  Add an item to a checklist

EXAMPLES
  $ trello trello checklist add-item checklistId123 "Buy groceries"
```

_See code: [src/commands/trello/checklist/add-item.ts](https://github.com/hesedcasa/trello/blob/v0.1.0/src/commands/trello/checklist/add-item.ts)_

## `trello trello checklist create CARDID NAME`

Create a new checklist on a card

```
USAGE
  $ trello trello checklist create CARDID NAME [--toon]

ARGUMENTS
  CARDID  Card ID
  NAME    Checklist name

FLAGS
  --toon  Format output as toon

DESCRIPTION
  Create a new checklist on a card

EXAMPLES
  $ trello trello checklist create cardId123 "My Checklist"
```

_See code: [src/commands/trello/checklist/create.ts](https://github.com/hesedcasa/trello/blob/v0.1.0/src/commands/trello/checklist/create.ts)_

## `trello trello checklist delete CHECKLISTID`

Delete a checklist

```
USAGE
  $ trello trello checklist delete CHECKLISTID

ARGUMENTS
  CHECKLISTID  Checklist ID

DESCRIPTION
  Delete a checklist

EXAMPLES
  $ trello trello checklist delete 5a1b2c3d
```

_See code: [src/commands/trello/checklist/delete.ts](https://github.com/hesedcasa/trello/blob/v0.1.0/src/commands/trello/checklist/delete.ts)_

## `trello trello checklist delete-item CHECKLISTID CHECKITEMID`

Delete an item from a checklist

```
USAGE
  $ trello trello checklist delete-item CHECKLISTID CHECKITEMID

ARGUMENTS
  CHECKLISTID  Checklist ID
  CHECKITEMID  Check item ID

DESCRIPTION
  Delete an item from a checklist

EXAMPLES
  $ trello trello checklist delete-item checklistId123 itemId456
```

_See code: [src/commands/trello/checklist/delete-item.ts](https://github.com/hesedcasa/trello/blob/v0.1.0/src/commands/trello/checklist/delete-item.ts)_

## `trello trello checklist get CHECKLISTID`

Get details of a specific checklist

```
USAGE
  $ trello trello checklist get CHECKLISTID [--toon]

ARGUMENTS
  CHECKLISTID  Checklist ID

FLAGS
  --toon  Format output as toon

DESCRIPTION
  Get details of a specific checklist

EXAMPLES
  $ trello trello checklist get 5a1b2c3d
```

_See code: [src/commands/trello/checklist/get.ts](https://github.com/hesedcasa/trello/blob/v0.1.0/src/commands/trello/checklist/get.ts)_

## `trello trello comment add CARDID TEXT`

Add a comment to a card

```
USAGE
  $ trello trello comment add CARDID TEXT [--toon]

ARGUMENTS
  CARDID  Card ID
  TEXT    Comment text

FLAGS
  --toon  Format output as toon

DESCRIPTION
  Add a comment to a card

EXAMPLES
  $ trello trello comment add cardId123 "This is a comment"

  $ trello trello comment add cardId123 "**Bold** _italic_ ~~strikethrough~~"

  $ trello trello comment add cardId123 "- Item 1
  - Item 2
  - Item 3"

  $ trello trello comment add cardId123 "Check [this](https://example.com) link"
```

_See code: [src/commands/trello/comment/add.ts](https://github.com/hesedcasa/trello/blob/v0.1.0/src/commands/trello/comment/add.ts)_

## `trello trello comment delete CARDID ACTIONID`

Delete a comment from a card

```
USAGE
  $ trello trello comment delete CARDID ACTIONID

ARGUMENTS
  CARDID    Card ID
  ACTIONID  Comment action ID

DESCRIPTION
  Delete a comment from a card

EXAMPLES
  $ trello trello comment delete cardId123 actionId456
```

_See code: [src/commands/trello/comment/delete.ts](https://github.com/hesedcasa/trello/blob/v0.1.0/src/commands/trello/comment/delete.ts)_

## `trello trello comment update CARDID ACTIONID TEXT`

Update a comment on a card

```
USAGE
  $ trello trello comment update CARDID ACTIONID TEXT [--toon]

ARGUMENTS
  CARDID    Card ID
  ACTIONID  Comment action ID
  TEXT      Updated comment text

FLAGS
  --toon  Format output as toon

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

_See code: [src/commands/trello/comment/update.ts](https://github.com/hesedcasa/trello/blob/v0.1.0/src/commands/trello/comment/update.ts)_

## `trello trello label create BOARDID NAME COLOR`

Create a new label on a board

```
USAGE
  $ trello trello label create BOARDID NAME COLOR [--toon]

ARGUMENTS
  BOARDID  Board ID
  NAME     Label name
  COLOR    (blue|green|orange|red|yellow|purple|pink|sky|lime|black) Label color

FLAGS
  --toon  Format output as toon

DESCRIPTION
  Create a new label on a board

EXAMPLES
  $ trello trello label create 5a1b2c3d "Bug" red
```

_See code: [src/commands/trello/label/create.ts](https://github.com/hesedcasa/trello/blob/v0.1.0/src/commands/trello/label/create.ts)_

## `trello trello label delete LABELID`

Delete a label

```
USAGE
  $ trello trello label delete LABELID

ARGUMENTS
  LABELID  Label ID

DESCRIPTION
  Delete a label

EXAMPLES
  $ trello trello label delete 5a1b2c3d
```

_See code: [src/commands/trello/label/delete.ts](https://github.com/hesedcasa/trello/blob/v0.1.0/src/commands/trello/label/delete.ts)_

## `trello trello label list BOARDID`

List all labels on a board

```
USAGE
  $ trello trello label list BOARDID [--toon]

ARGUMENTS
  BOARDID  Board ID

FLAGS
  --toon  Format output as toon

DESCRIPTION
  List all labels on a board

EXAMPLES
  $ trello trello label list 5a1b2c3d
```

_See code: [src/commands/trello/label/list.ts](https://github.com/hesedcasa/trello/blob/v0.1.0/src/commands/trello/label/list.ts)_

## `trello trello list archive LISTID`

Archive a list or all cards in a list

```
USAGE
  $ trello trello list archive LISTID [--cards-only]

ARGUMENTS
  LISTID  List ID

FLAGS
  --cards-only  Only archive cards in the list, not the list itself

DESCRIPTION
  Archive a list or all cards in a list

EXAMPLES
  $ trello trello list archive 5a1b2c3d

  $ trello trello list archive 5a1b2c3d --cards-only
```

_See code: [src/commands/trello/list/archive.ts](https://github.com/hesedcasa/trello/blob/v0.1.0/src/commands/trello/list/archive.ts)_

## `trello trello list cards LISTID`

Get all cards in a list

```
USAGE
  $ trello trello list cards LISTID [--toon]

ARGUMENTS
  LISTID  List ID

FLAGS
  --toon  Format output as toon

DESCRIPTION
  Get all cards in a list

EXAMPLES
  $ trello trello list cards 5a1b2c3d
```

_See code: [src/commands/trello/list/cards.ts](https://github.com/hesedcasa/trello/blob/v0.1.0/src/commands/trello/list/cards.ts)_

## `trello trello list create BOARDID NAME`

Create a new list on a board

```
USAGE
  $ trello trello list create BOARDID NAME [--pos top|bottom] [--toon]

ARGUMENTS
  BOARDID  Board ID
  NAME     List name

FLAGS
  --pos=<option>  Position of the list (top, bottom)
                  <options: top|bottom>
  --toon          Format output as toon

DESCRIPTION
  Create a new list on a board

EXAMPLES
  $ trello trello list create 5a1b2c3d "To Do"

  $ trello trello list create 5a1b2c3d "Done" --pos bottom
```

_See code: [src/commands/trello/list/create.ts](https://github.com/hesedcasa/trello/blob/v0.1.0/src/commands/trello/list/create.ts)_

## `trello trello list get LISTID`

Get details of a specific list

```
USAGE
  $ trello trello list get LISTID [--toon]

ARGUMENTS
  LISTID  List ID

FLAGS
  --toon  Format output as toon

DESCRIPTION
  Get details of a specific list

EXAMPLES
  $ trello trello list get 5a1b2c3d
```

_See code: [src/commands/trello/list/get.ts](https://github.com/hesedcasa/trello/blob/v0.1.0/src/commands/trello/list/get.ts)_

## `trello trello member get [MEMBERID]`

Get member details

```
USAGE
  $ trello trello member get [MEMBERID] [--toon]

ARGUMENTS
  [MEMBERID]  [default: me] Member ID or username (defaults to "me")

FLAGS
  --toon  Format output as toon

DESCRIPTION
  Get member details

EXAMPLES
  $ trello trello member get

  $ trello trello member get me

  $ trello trello member get johndoe
```

_See code: [src/commands/trello/member/get.ts](https://github.com/hesedcasa/trello/blob/v0.1.0/src/commands/trello/member/get.ts)_
<!-- commandsstop -->
