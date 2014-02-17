## LeanKit Node Client

The LeanKit client module for Node.js provides an easy-to-use set of functions designed to simplify the integration of external systems and utilities with your LeanKit account. 

### Requirements

* [Node.js](http://nodejs.org)
* A [LeanKit](http://leankit.com) account

### Installing the client

	npm install leankit-client

### Client usage

	var LeanKitClient = require('leankit-client');
	var client = LeanKitClient.newClient('account-name', 'your@email.com', 'your-p@ssw0rd');

	client.getBoards(function(err, res){
		console.log(res);
	});

Review the [tests](https://github.com/LeanKit/leankit-node-client/blob/master/test/client-tests.js) for a full list of client functions and how to use them.

### Installing Manually

* Clone or download the `leankit-node-client` Github repository.
* Open a Terminal window, change to the repository folder, and install dependent packages.

		npm install

* Create a folder in your node application's `node_modules` folder named `leankit-client` (e.g. `[project-name]/node_modules/leankit-client).
* Copy all the files and folders in the `leankit-node-client` folder to the `leankit-client` folder created in the previous step. 

### Compiling leankit-client.js

The LeanKit client for Node.js is written in CoffeeScript. To make changes, you'll need the CoffeeScript compiler.

	npm install -g coffee-script

Next, compile the LeanKit client module using:

	coffee --compile leankit-client.coffee

### Running Tests

* Set environment variables for the LeanKit account you wish to test with

		export LEANKIT_ACCOUNT=[your-account-name]
		export LEANKIT_EMAIL=[your@email.com]
		export LEANKIT_PASSWORD=[your-p@ssw0rd]
		export LEANKIT_TEST_BOARD=[name-of-your-test-board]

* Install [Mocha](http://visionmedia.github.io/mocha/)

		npm install -g mocha

* Open Terminal and change to the LeanKit Node Client directory
* Run Mocha, specifying a reporter

		mocha --reporter spec

### Questions?

Visit [support.leankit.com](http://support.leankit.com).

### License

The LeanKit Node Client is licensed under [MIT](http://www.opensource.org/licenses/mit-license.php). Refer to [license.txt](https://github.com/LeanKit/leankit-node-client/blob/master/License.txt) for more information.
