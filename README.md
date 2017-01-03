## LeanKit Node Client

The LeanKit client module for Node.js provides an easy-to-use set of functions designed to simplify the integration of external systems and utilities with your LeanKit account. The client supports both callbacks and promises. There is also a `LeanKitEvents` module for subscribing to board events.

### Requirements

* [Node.js](http://nodejs.org)
* A [LeanKit](http://leankit.com) account

### Installing the client

```
npm install leankit-client
```

### Client usage (callbacks)

```
var LeanKitClient = require( "leankit-client" );
var client = new LeanKitClient( "account-name", "your@email.com", "your-p@ssw0rd" );

client.getBoards( function( err, boards ) {
	console.log( boards );
} );
```

### Client usage (promises)

```
var LeanKitClient = require( "leankit-client" );
var client = new LeanKitClient( "account-name", "your@email.com", "your-p@ssw0rd" );

client.getBoards().then( function( boards ) {
	console.log( boards );
}, function( err ) {
	console.log( "ERR:", err );
} );
```

Review the [tests](https://github.com/LeanKit/leankit-node-client/tree/master/test) for a full list of client functions and how to use them.

### Subscribe to events

The LeanKit Client includes a module for monitoring a board for events, such as when cards are created, moved, assigned, and so forth.

**Events usage**

```
var LeanKitEvents = require( "leankit-client/events" );
var events = new LeanKitEvents( client, boardId [, version] [, pollInterval] );
events.on( "event-name", function( e ) {
	// Do something with the event
} );
events.start();
```

**Constructor options**

|Parameter|Description|
|:---|:---|
|`client`|An instance of the `LeanKitClient`.|
|`boardId`|The ID of the LeanKit Board to subscribe to.|
|`version`|Optional Board version number. If events have occurred since the given `version`, those will be returned immediately.|
|`pollInterval`|Optional polling interval in seconds. The default is 30 seconds.|
|`resumeAfterError`|Optional handling of errors. If an error occurs with `resumeAfterError = false` the client will stop polling for changes. The default is `true`.|

**Sample**

```
var LeanKitClient = require( "leankit-client" );
var LeanKitEvents = require( "leankit-client/events" );
var client = new LeanKitClient( "account-name", "your@email.com", "your-p@ssw0rd" );
var boardId = 445566789; // The board ID to subscribe to
var events = new LeanKitEvents( client, boardId );
events.on( "card-creation", function( e ) {
	console.log( e );
} );
events.start();
```

**Sample output when a card is added to the subscribed board:**

```
{ cardId: 123456789,
  eventType: 'card-creation',
  eventDateTime: '11/06/2015 03:38:05 PM',
  message: 'David Neal created the Card [Sample Card 1] within Lane [ToDo].',
  toLaneId: 456789123,
  fromLaneId: null,
  requiresBoardRefresh: false,
  isBlocked: false,
  blockedComment: null,
  userId: 62984826,
  assignedUserId: 0,
  isUnassigning: false,
  commentText: null,
  wipOverrideComment: null,
  wipOverrideLane: 0,
  wipOverrideUser: 0,
  taskboardParentCardId: 0,
  taskboardId: 0,
  boardVersion: 2 }
```


**Card events**

|Event|Description|
|:---|:---|
|`card-creation`|Occurs when a new card is added to a board.|
|`card-move`|Occurs when a card is moved on the board.|
|`card-fields-changed`|Occurs when a card's fields are modified (e.g. Title, Description, and so forth)|
|`comment-post`|Occurs when a user posts a comment on a card.|
|`user-assignment`|Occurs when users are assigned or unassigned from a card. Check the `isUnassigning` property to know whether the user is being assigned or unassigned.|
|`attachment-change`|Occurs when an attachment is added to a card.|
|`card-blocked`|Occurs when a card is blocked or unblocked. Check the `isBlocked` property to know whether the card was blocked or unblocked.|
|`card-move-from-board`|Occurs when a card is moved from the board being monitored to another board.|
|`card-move-to-board`|Occurs when a card is moved from another board to the board being monitored.|
|`card-deleted`|Occurs when a card is deleted.|

**Board events**

|Event|Description|
|:---|:---|
|`board-edit`|Occurs when the board layout/structure is modified.|
|`activity-types-changed` |Occurs when custom icons are modified.|
|`board-card-types-changed`|Occurs when card types for the board are modified.|

### Proxy support

To use the LeanKit client behind a proxy server, pass an options object to the module constructor that includes the proxy server. For example:

```
var LeanKitClient = require("leankit-client");
var client = LeanKitClient.createClient("account-name", "your@email.com", "your-p@ssw0rd", { "proxy": "http://localproxy.com" } );
```

This `options` object is the same object used by the [request module](https://github.com/mikeal/request#requestoptions-callback).

### Installing manually

* Install [babel](https://babeljs.io/docs/setup/#node)
* Clone or download the `leankit-node-client` Github repository.
* Open a Terminal window, change to the repository folder, and install dependent packages.

	```
	npm install
	```

* Create a folder in your node application's `node_modules` folder named `leankit-client` (e.g. `[project-name]/node_modules/leankit-client).
* Copy all the files and folders in the `leankit-node-client` folder to the `leankit-client` folder created in the previous step.

### Running tests

* Set environment variables for the LeanKit account you wish to test with.

	**OSX/Linux**

	```
	export LEANKIT_ACCOUNT=your-account-name
	export LEANKIT_EMAIL=your@email.com
	export LEANKIT_PASSWORD=your-p@ssw0rd
	export LEANKIT_TEST_BOARD=name-of-your-test-board
	```

	**Windows**

	```
	setx LEANKIT_ACCOUNT "your-account-name"
	setx LEANKIT_EMAIL "your@email.com"
	setx LEANKIT_PASSWORD "your-p@ssw0rd"
	setx LEANKIT_TEST_BOARD "name-of-your-test-board"
	```

	Note: On Windows, you will need to reopen your command prompt after setting environment variables.

* Install [Mocha](http://visionmedia.github.io/mocha/)

	```
	npm install -g mocha
	```

* Open Terminal and change to the LeanKit Node Client directory
* Run tests

	```
	npm test
	```

### Questions?

Visit [support.leankit.com](http://support.leankit.com).

### License

The LeanKit Node Client is licensed under [MIT](http://www.opensource.org/licenses/mit-license.php). Refer to [license.txt](https://github.com/LeanKit/leankit-node-client/blob/master/License.txt) for more information.
