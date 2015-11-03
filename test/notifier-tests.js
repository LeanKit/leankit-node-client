let chai = require( "chai" );
let should = chai.should();
let chaiAsPromised = require( "chai-as-promised" );
chai.use( chaiAsPromised );
// let when = require( "when" );
const LeanKitClient = require( "../src/leankit-client" );
const LeanKitNotifer = require( "../src/leankit-notifier" );
const accountName = process.env.LEANKIT_ACCOUNT || "your-account-name";
const email = process.env.LEANKIT_EMAIL || "your@email.com";
const pwd = process.env.LEANKIT_PASSWORD || "p@ssw0rd";
const proxy = process.env.LEANKIT_PROXY || null;
const boardToFind = process.env.LEANKIT_TEST_BOARD || "API Test Board";

describe( "Notifier Tests", function() {
	this.timeout( 20000 );
	let client = {};
	let board = {};
	let notifier = {};

	before( () => {
		if ( !proxy ) {
			client = new LeanKitClient( accountName, email, pwd );
		} else {
			process.env[ "NODE_TLS_REJECT_UNAUTHORIZED" ] = "0";
			client = new LeanKitClient( accountName, email, pwd, {
				proxy: proxy
			} );
		}

		return client.getBoardByName( boardToFind ).then( ( res ) => {
			board = res;
			board.Title.should.equal( boardToFind );
			board.BoardUsers.length.should.be.above( 0 );
			notifier = new LeanKitNotifer( client, board.Id, board.Version );
		} );
	} );

	it( "emits events", ( done ) => {
		notifier.on( "polling", ( boardInfo ) => {
			console.log( "polling:", boardInfo.id, boardInfo.version );
		} );

		notifier.on( "update", ( update ) => {
			console.log( "update:", update );
			done();
		} );

		notifier.on( "error", ( err ) => {
			console.log( "error:", err );
		} );

		notifier.start();
	} );
} );
