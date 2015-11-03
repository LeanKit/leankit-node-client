// var fs = require( "fs" );
// var _ = require( "lodash" );
// let should = require( "should" );
// let nock = require( "nock" );
const LeanKitClient = require( "../src/leankit-client" );
const LeanKitNotifer = require( "../src/leankit-notifier" );
const accountName = process.env.LEANKIT_ACCOUNT || "your-account-name";
const email = process.env.LEANKIT_EMAIL || "your@email.com";
const pwd = process.env.LEANKIT_PASSWORD || "p@ssw0rd";
const boardToFind = process.env.LEANKIT_TEST_BOARD || "API Test Board";

describe.skip( "Notifier Tests", function() {
	this.timeout( 20000 );
	let client = {};
	let board = {};
	let notifier = {};

	before( ( done ) => {
		if ( accountName !== "kanban-cibuild" ) {
			client = new LeanKitClient( accountName, email, pwd );
		} else {
			process.env.NODE.TLS.REJECT.UNAUTHORIZED = "0" ; //[ "NODE_TLS_REJECT_UNAUTHORIZED" ] = "0";
			client = new LeanKitClient( accountName, email, pwd, {
				proxy: "http://127.0.0.1:8888"
			} );
		}
		client.getBoardByName( boardToFind, ( err, res ) => {
			board = res;
			board.Title.should.equal( boardToFind );
			board.BoardUsers.length.should.be.above( 0 );
			notifier = new LeanKitNotifer( client, board.Id, board.Version );
			// console.log( notifier );
			done();
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
