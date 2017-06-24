## LeanKit Node Client

The LeanKit client module for Node.js provides an easy-to-use set of functions designed to simplify the integration of external systems and utilities with your LeanKit account.

Note: There is a separate [LeanKit Events](https://github.com/leankit/leankit-node-events) module for subscribing to board events.

### Requirements

* [Node.js](https://nodejs.org) 4.x or higher
* A [LeanKit](https://leankit.com) account

### Installing the client

```
npm install leankit-client
```

### Client usage

```
const LeanKitClient = require( "leankit-client" );
const auth = {
	account: "account-name",
	email: "your@email.com",
	password: "your-p@ssw0rd"
};
const client = LeanKitClient( auth );

client.board.list().then( res => {
	console.log( res );
} ).catch( err => {
	console.log( "Error:", err );
} );
```

### Example using `async`/`await`

```
const LeanKitClient = require( "leankit-client" );

const getBoards = async ( client ) => {
	const res = await client.board.list();
	return res.data.boards;
};

const main = async () => {
	const auth = {
		account: "account-name",
		email: "your@email.com",
		password: "your-p@ssw0rd"
	};
	const client = LeanKitClient( auth );
	const boards = await getBoards( client );
	console.log( boards );
};

main().then( () => {
	console.log( "done" );
} );
```

## API

The LeanKit Client supports all new `/io` API endpoints, as well as legacy `/kanban/api` endpoints.

### Current API

The following is a list of current generation endpoints supported by the LeanKit Client. For more details about the expected data expected for each endpoint, please refer to the developer documentation provided in your LeanKit account by visiting:

`https://{your-account}.leankit.com/io`

Replace `{your-account}` in the URL with the name of your LeanKit account.

#### Account

|Method|API endpoint|Description|
|:---|:---|:---|
|`.account.get()`|`GET /io/account`|Get the user profile of the authenticated user.|

#### Auth Tokens

|Method|API endpoint|Description|
|:---|:---|:---|
|`.auth.token.list()`|`GET /io/auth/token`|Get a list of tokens created for the authenticated user.|
|`.auth.token.create( description )`|`POST /io/auth/token`|Create a new token.|
|`.auth.token.revoke( id )`|`DELETE /io/auth/token/$id`|Revoke a token.|

#### Boards

|Method|API endpoint|Description|
|:---|:---|:---|
|`.board.list( { params } )`|`GET /io/board`|Get a list of boards the authenticated user has access to. `params` may include search and paging options. Refer to the API documentation for details.|
|`.board.get( boardId )`|`GET /io/board/$boardId`|Get a specific board.|
|`.board.create( { boardCreateRequest } )`|`POST /io/board/`|Create a new board based on a template or existing board. Refer to the API documentation for details.|
|`.board.customFields.list( boardId )`|`GET /io/board/$boardId/customfield`|Get a list of custom fields configured for the given board ID.|
|`.board.customFields.update( boardId, [ { operations } ] )`|`PATCH /io/board/$boardId/customfield`|Modify the custom fields for the given board ID. The array of operations can include adding, replacing, or removing custom fields. Refer to the API documentation for details.|

#### Board Templates

|Method|API endpoint|Description|
|:---|:---|:---|
|`.template.list()`|`GET /io/template`|Get a list of all board templates.|
|`.template.create( { templateCreateRequest } )`|`POST /io/template`|Create a board template. Refer to the API documentation for details.|
|`.template.destroy( id )`|`DELETE /io/template/$id`|Delete a board template.|

#### Cards

|Method|API endpoint|Description|
|:---|:---|:---|
|`.card.list( { params } )`|`GET /io/card`|Get a list of cards the authenticated user has access to. `params` may include search and paging options. Refer to the API documentation for details.|
|`.card.get( cardId )`|`GET /io/card/$cardId`|Get a specific card by its ID.|
|`.card.update( cardId, [ { operations } ] )`|`PATCH /io/card/$cardId`|Modify properties of the given card ID. The array of operations can include adding, replacing, or removing property values. Refer to the API documentation for details.|
|`.card.destroy( cardId )`|`DELETE /io/card/$cardId`|Delete the specified card.|
|`.card.comment.list( cardId )`|`GET /io/card/$cardId/comment`|Get a list of card comments.|
|`.card.comment.create( cardId, text )`|`POST /io/card/$cardId/comment`|Add a new comment to the given card.|
|`.card.comment.update( cardId, commentId, text )`|`PUT /io/card/$cardId/comment/$commentId`|Update a comment by its ID.|
|`.card.comment.destroy( cardId, commentId )`|`DELETE /io/card/$cardId/comment/$commentId`|Delete the specified comment.|
|`.card.attachment.list( cardId )`|`GET /io/card/$cardId/attachment`|Get a list of file attachments.|
|`.card.attachment.create( cardId, { name, description, file } )`|`POST /io/card/$cardId/attachment`|Add a new file attachment to the given card. `file` must be a readable stream.|
|`.card.attachment.download( cardId, attachmentId, stream )`|`GET /io/card/$cardId/attachment/$attachmentId/content`|Download a file attachment. `stream` must be a writeable stream.|
|`.card.attachment.destroy( cardId, attachmentId )`|`DELETE /io/card/$cardId/attachment/$attachmentId`|Delete the specified file attachment.|

#### Card Tasks

|Method|API endpoint|Description|
|:---|:---|:---|
|`.task.get( cardId, taskId )`|`GET /io/card/$cardId/tasks/$taskId`|Get a task card by the given ID.|
|`.task.create( cardId, { taskCreateRequest } )`|`POST /io/card/$cardId/tasks`|Create a task card on the given card's taskboard.|

#### Reporting

For reporting API export configuration options, please refer [Reporting API documentation](https://support.leankit.com/hc/en-us/articles/115000323287-Advanced-Reporting-API-Overview).

|Method|API endpoint|Description|
|:---|:---|:---|
|`.reporting.auth.token()`|`POST /io/reporting/auth`|Generate a reporting API authentication token. A token is required to access the other reporting API endpoints.|
|`.reporting.export.cards( { token, stream, config } )`|`GET /io/reporting/export/cards`|Download all the cards the authenticated user has access to.|
|`.reporting.export.cardpositions( { token, stream, config } )`|`GET /io/reporting/export/cardpositions`|Download all the card lane positions.|
|`.reporting.export.userassignments( { token, stream, config } )`|`GET /io/reporting/export/userassignments/current`|Download all the current user assignments.|
|`.reporting.export.userassignments.history( { token, stream, config } )`|`GET /io/reporting/export/userassignments/history`|Download the history of user assignments.|
|`.reporting.export.lanes( { token, stream, config } )`|`GET /io/reporting/export/lanes`|Download all board lanes.|
|`.reporting.export.tags( { token, stream, config } )`|`GET /io/reporting/export/tags`|Download all tags currently assigned to cards.|

#### Users

|Method|API endpoint|Description|
|:---|:---|:---|
|`.user.list( { params } )`|`GET /io/user`|Get a list of users. `params` can include data paging operations. Refer to the API documentation for details.|
|`.user.me()`|`GET /io/user/me`|Get the profile of the current authenticated user.|
|`.user.get( userId )`|`GET /io/user/$userId`|Get the profile of the given user ID.|
|`.user.boards.recent()`|`GET /io/user/me/board/recent`|Get a list of recently accessed boards for the currently authenticated user.|


### Legacy API

#### Boards

|Method|API endpoint|Description|
|:---|:---|:---|
|`.v1.board.list()`|`GET /kanban/api/boards`||
|`.v1.board.get( boardId )`|`GET /kanban/api/boards/$boardId`||
|`.v1.board.identifiers( boardId )`|`GET /kanban/api/board/$boardId/GetBoardIdentifiers`||
|`.v1.board.backlog( boardId )`|`GET /kanban/api/board/$boardId/backlog`||
|`.v1.board.archive( boardId )`|`GET /kanban/api/board/$boardId/archive`||
|`.v1.board.archive.cards( boardId )`|`GET /kanban/api/board/$boardId/archivecards`||
|`.v1.board.since.version( boardId, version )`|`GET /kanban/api/board/$boardId/boardversion/$version/GetNewerIfExists`||
|`.v1.board.since.version.history( boardId, version )`|`GET /kanban/api/board/$boardId/boardversion/$version/GetBoardHistorySince`||
|`.v1.board.since.version.updates( boardId, version )`|`GET /kanban/api/board/$boardId/boardversion/$version/CheckForUpdates`||

#### Cards

|Method|API endpoint|Description|
|:---|:---|:---|
|`.v1.card.get( boardId, cardId )`|`GET /kanban/api/board/$boardId/getcard/$cardId`||
|`.v1.card.get.by.externalCardId( boardId, externalCardId )`|`GET /kanban/api/board/$boardId/GetCardByExternalId/$externalCardId`||
|`.v1.card.create( boardId, cardObject [, laneId] [, position] [, wipOverrideComment] )`|`POST /kanban/api/board/$boardId/AddCardWithWipOverride/lane/$laneId/position/$position`||
|`.v1.card.create.multiple( boardId, cardsArray, [, wipOverrideComment] )`|`POST /kanban/api/board/$boardId/AddCards`||
|`.v1.card.move( boardId, cardId, toLaneId, [, position] [, wipOverrideComment] )`|`POST /kanban/api/board/$boardId/MoveCardWithWipOverride/$cardId/lane/$toLaneId/position/$position`||
|`.v1.card.move.by.externalCardId( boardId, externalCardId, toLaneId, [, position] [, wipOverrideComment] )`|`POST /kanban/api/board/$boardId/MoveCardByExternalId/$externalCardId/lane/$toLaneId/position/$position`||
|`.v1.card.move.to.board( cardId, destinationBoardId )`|`POST /kanban/api/card/MoveCardToAnotherBoard/$cardId/$destinationBoardId`||
|`.v1.card.update( boardId, cardObject [, wipOverrideComment] )`|`POST /kanban/api/board/$boardId/UpdateCardWithWipOverride`||
|`.v1.card.update.fields( { cardFieldsUpdateRequest } )`|`POST /kanban/api/card/update`||
|`.v1.card.update.multiple( boardId, cardsArray [, wipOverrideComment] )`|`POST /kanban/api/board/$boardId/UpdateCards`||
|`.v1.card.history( boardId, cardId )`|`GET /kanban/api/card/history/$boardId/$cardId`||
|`.v1.card.search( boardId, { searchRequest } )`|`POST /kanban/api/board/$boardId/SearchCards`||
|`.v1.card.list.recent( boardId )`|`GET /kanban/api/board/$boardId/ListNewCards`||
|`.v1.card.destroy( boardId, cardId )`|`POST /kanban/api/board/$boardId/DeleteCard/$cardId`||
|`.v1.card.destroy.multiple( boardId, cardIdArray )`|`POST /kanban/api/board/$boardId/DeleteCards`||
|`.v1.card.attachment.count( boardId, cardId )`|`GET /kanban/api/card/GetAttachmentsCount/$boardId/$cardId`||
|`.v1.card.attachment.list( boardId, cardId )`|`GET /kanban/api/card/GetAttachments/$boardId/$cardId`||
|`.v1.card.attachment.get( boardId, cardId, attachmentId )`|`GET /kanban/api/card/GetAttachments/$boardId/$cardId/$attachmentId`||
|`.v1.card.attachment.create( boardId, cardId, { name, description, file } )`|`POST /kanban/api/card/SaveAttachment/$boardId/$cardId`||
|`.v1.card.attachment.download( boardId, attachmentId, stream )`|`GET /kanban/api/card/DownloadAttachment/$boardId/$attachmentId `||
|`.v1.card.attachment.destroy( boardId, cardId, attachmentId )`|`POST /kanban/api/card/DeleteAttachment/$boardId/$cardId/$attachmentId`||
|`.v1.card.comment.list( boardId, cardId )`|`GET /kanban/api/card/GetComments/$boardId/$cardId`||
|`.v1.card.comment.create( boardId, cardId, userId, comment )`|`POST /kanban/api/card/SaveComment/$boardId/$cardId`||
|`.v1.card.comment.create.by.externalId( boardId, externalCardId, userId, comment )`|`POST /kanban/api/card/SaveCommentByExternalId/$boardId/$externalCardId`||

#### Card Tasks

|Method|API endpoint|Description|
|:---|:---|:---|
|`.v1.task.board.get( boardId, cardId )`|`GET /kanban/api/v1/board/$boardId/card/$cardId/taskboard`||
|`.v1.task.board.since.version( boardId, cardId, version )`|`GET /kanban/api/v1/board/$boardId/card/$cardId/tasks/boardversion/$version`||
|`.v1.task.create( boardId, cardId, taskCardObject [, laneId] [, position] [, wipOverrideReason] )`|`POST /kanban/api/v1/board/$boardId/card/$cardId/tasks/$laneId/position/$position`||
|`.v1.task.update( boardId, cardId, taskCardObject [, wipOverrideReason] )`|`POST /kanban/api/v1/board/$boardId/card/$cardId/tasks/$taskId`||
|`.v1.task.move( boardId, cardId, taskId, toLaneId [, position] )`|`POST /kanban/api/v1/board/$boardId/move/card/$cardId/tasks/$taskId/lane/$toLaneId/position/$position`||
|`.v1.task.destroy( boardId, cardId, taskId )`|`POST /kanban/api/v1/board/$boardId/delete/card/$cardId/tasks/$taskId`||

## Proxy support

To use the LeanKit Client behind a proxy server, include a `config` object in the authentication with your proxy server address. For example:

```
const LeanKitClient = require( "leankit-client" );
const auth = {
	account: "account-name",
	email: "your@email.com",
	password: "your-p@ssw0rd",
	config: {
		proxy: "http://localproxy.com"
	}
};
const client = LeanKitClient( auth );
```

This `config` object is the same object used by the internal [request] (https://github.com/mikeal/request#requestoptions-callback) module.

### Questions or Issues?

Submit questions or issues [here](https://github.com/leankit/leankit-node-client/issues).

### License

The LeanKit Node Client is licensed under [MIT](http://www.opensource.org/licenses/mit-license.php). Refer to [license.txt](https://github.com/LeanKit/leankit-node-client/blob/master/License.txt) for more information.
