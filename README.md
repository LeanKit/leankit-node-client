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

|Method|API endpoint|Description|
|:---|:---|:---|
|`.account.get()`|`GET /io/account`|Get the user profile of the authenticated user.|
|`.auth.token.list()`|`GET /io/auth/token`|Get a list of tokens created for the authenticated user.|
|`.auth.token.create( description )`|`POST /io/auth/token`|Create a new token.|
|`.auth.token.revoke( id )`|`DELETE /io/auth/token/$id`|Revoke a token.|

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
