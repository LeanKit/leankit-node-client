let jetpack = require( "fs-jetpack" );
let nock = require( "nock" );
let chai = require( "chai" );
let should = chai.should();
let chaiAsPromised = require( "chai-as-promised" );
chai.use( chaiAsPromised );
import LeanKitClient from "../src/client";
import LeanKitEvents from "../src/events";
const accountName = process.env.LEANKIT_ACCOUNT || "your-account-name";
const email = process.env.LEANKIT_EMAIL || "your@email.com";
const pwd = process.env.LEANKIT_PASSWORD || "p@ssw0rd";
const proxy = process.env.LEANKIT_PROXY || null;
// const boardToFind = process.env.LEANKIT_TEST_BOARD || "API Test Board";

describe( "Events Tests", () => {
	let client = {};
	// let board = {};
	let events = {};
	let url = "";
	const boardId = 101;
	const version = 1;

	let testWaitForNextUpdate = function( eventType ) {
		return events.waitForNextUpdate().then( ( res ) => {
			// console.log( res );
			res.should.be.ok;
			res.should.be.instanceOf( Array );
			let e = res.find( ( ev ) => {
				return ev.eventType === eventType;
			} );
			should.exist( e );
			e.should.have.property( "eventDateTime" );
			e.should.have.property( "boardVersion" );
		}, ( err ) => {
			console.log( "ERR:", err );
			should.not.exist( err );
		} );
	};

	let testEventEmitter = function( events, eventType, done ) {
		events.once( eventType, ( e ) => {
			events.stop();
			e.should.have.property( "eventType" ).that.is.equal( eventType );
			e.should.have.property( "eventDateTime" );
			e.should.have.property( "boardVersion" ).that.is.equal( 2 );
			done();
		} );
		events.start();
	};

	let mockApiCall = function( mockResponseFile ) {
		let boardEvent = jetpack.read( mockResponseFile, "json" );
		nock( url )
			.get( "/kanban/api/board/101/boardversion/1/checkforupdates" )
			.reply( 200, boardEvent );
		nock( url )
			.get( "/kanban/api/board/101/boardversion/2/checkforupdates" )
			.reply( 200, boardEvent );
	};

	before( () => {
		url = accountName.startsWith( "http" ) ? accountName : "https://" + accountName + ".leankit.com";

		if ( !proxy ) {
			client = new LeanKitClient( accountName, email, pwd );
		} else {
			process.env[ "NODE_TLS_REJECT_UNAUTHORIZED" ] = "0";
			client = new LeanKitClient( accountName, email, pwd, {
				proxy: proxy
			} );
		}
	} );

	describe( "client constructor", () => {
		const testVersion = 33;
		const testPollInterval = 55;
		before( () => {
			events = new LeanKitEvents( client, boardId, testVersion, testPollInterval );
		} );

		it( "has the right board version", () => {
			events.version.should.equal( testVersion );
		} );

		it( "has the right polling interval", () => {
			events.pollInterval.should.equal( testPollInterval );
		} );
	} );

	describe( "default client constructor", () => {
		const eventType = "activity-types-changed";
		const mockResponseFile = "./test/test-files/activity-types-changed.json";
		let boardScope = {};
		before( () => {
			events = new LeanKitEvents( client, boardId );
			mockApiCall( mockResponseFile );
			boardScope = nock( url )
				.get( "/kanban/api/boards/101" )
				.reply( 200, { Version: 1 } );
		} );

		after( () => {
			nock.cleanAll();
		} );

		it( "gets the board to determine the latest board version", ( done ) => {
			events.once( eventType, ( e ) => {
				events.stop();
				boardScope.isDone().should.equal( true );
				done();
			} );
			events.start();
		} );

		it( "defaults to 30 seconds polling", () => {
			events.pollInterval.should.equal( 30 );
		} );
	} );

	describe( "activity types changed event", () => {
		const eventType = "activity-types-changed";
		const mockResponseFile = "./test/test-files/activity-types-changed.json";
		before( () => {
			events = new LeanKitEvents( client, boardId, version );
			mockApiCall( mockResponseFile );
		} );

		after( () => {
			nock.cleanAll();
		} );

		it( "waitForNextUpdate should return correct event", () => {
			return testWaitForNextUpdate( eventType );
		} );

		it( "should emit correct event", ( done ) => {
			testEventEmitter( events, eventType, done );
		} );
	} );

	describe( "board card types changed event", () => {
		const eventType = "board-card-types-changed";
		const mockResponseFile = "./test/test-files/board-card-types-changed.json";
		before( () => {
			events = new LeanKitEvents( client, boardId, version );
			mockApiCall( mockResponseFile );
		} );

		after( () => {
			nock.cleanAll();
		} );

		it( "waitForNextUpdate should return correct event", () => {
			return testWaitForNextUpdate( eventType );
		} );

		it( "should emit correct event", ( done ) => {
			testEventEmitter( events, eventType, done );
		} );
	} );

	describe( "board edited event", () => {
		const eventType = "board-edit";
		const mockResponseFile = "./test/test-files/board-edited.json";
		before( () => {
			events = new LeanKitEvents( client, boardId, version );
			mockApiCall( mockResponseFile );
		} );

		after( () => {
			nock.cleanAll();
		} );

		it( "waitForNextUpdate should return correct event", () => {
			return testWaitForNextUpdate( eventType );
		} );

		it( "should emit correct event", ( done ) => {
			events.once( eventType, ( e ) => {
				events.stop();
				e.should.have.property( "eventType" ).that.is.equal( eventType );
				e.should.have.property( "eventDateTime" );
				e.should.have.property( "boardVersion" ).that.is.equal( 2 );
				e.should.have.property( "board" );
				done();
			} );
			events.start();
		} );
	} );

	describe( "card attachment added event", () => {
		const eventType = "attachment-change";
		const mockResponseFile = "./test/test-files/card-attachment-added.json";
		before( () => {
			events = new LeanKitEvents( client, boardId, version );
			mockApiCall( mockResponseFile );
		} );

		after( () => {
			nock.cleanAll();
		} );

		it( "waitForNextUpdate should return correct event", () => {
			return testWaitForNextUpdate( eventType );
		} );

		it( "should emit correct event", ( done ) => {
			testEventEmitter( events, eventType, done );
		} );
	} );

	describe( "card blocked event", () => {
		const eventType = "card-blocked";
		const mockResponseFile = "./test/test-files/card-blocked.json";
		before( () => {
			events = new LeanKitEvents( client, boardId, version );
			mockApiCall( mockResponseFile );
		} );

		after( () => {
			nock.cleanAll();
		} );

		it( "waitForNextUpdate should return correct event", () => {
			return testWaitForNextUpdate( eventType );
		} );

		it( "should emit correct event", ( done ) => {
			testEventEmitter( events, eventType, done );
		} );
	} );

	describe( "card unblocked event", () => {
		const eventType = "card-blocked";
		const mockResponseFile = "./test/test-files/card-unblocked.json";
		before( () => {
			events = new LeanKitEvents( client, boardId, version );
			mockApiCall( mockResponseFile );
		} );

		after( () => {
			nock.cleanAll();
		} );

		it( "waitForNextUpdate should return correct event", () => {
			return testWaitForNextUpdate( eventType );
		} );

		it( "should emit correct event", ( done ) => {
			testEventEmitter( events, eventType, done );
		} );
	} );

	describe( "card comment added event", () => {
		const eventType = "comment-post";
		const mockResponseFile = "./test/test-files/card-comment-added.json";
		before( () => {
			events = new LeanKitEvents( client, boardId, version );
			mockApiCall( mockResponseFile );
		} );

		after( () => {
			nock.cleanAll();
		} );

		it( "waitForNextUpdate should return correct event", () => {
			return testWaitForNextUpdate( eventType );
		} );

		it( "should emit correct event", ( done ) => {
			testEventEmitter( events, eventType, done );
		} );
	} );

	describe( "card created event", () => {
		const eventType = "card-creation";
		const mockResponseFile = "./test/test-files/card-created.json";
		before( () => {
			events = new LeanKitEvents( client, boardId, version );
			mockApiCall( mockResponseFile );
		} );

		after( () => {
			nock.cleanAll();
		} );

		it( "waitForNextUpdate should return correct event", () => {
			return testWaitForNextUpdate( eventType );
		} );

		it( "should emit correct event", ( done ) => {
			testEventEmitter( events, eventType, done );
		} );
	} );

	describe( "card deleted event", () => {
		const eventType = "card-deleted";
		const mockResponseFile = "./test/test-files/card-deleted.json";
		before( () => {
			events = new LeanKitEvents( client, boardId, version );
			mockApiCall( mockResponseFile );
		} );

		after( () => {
			nock.cleanAll();
		} );

		it( "waitForNextUpdate should return correct event", () => {
			return testWaitForNextUpdate( eventType );
		} );

		it( "should emit correct event", ( done ) => {
			testEventEmitter( events, eventType, done );
		} );
	} );

	describe( "card fields changed event", () => {
		const eventType = "card-fields-changed";
		const mockResponseFile = "./test/test-files/card-fields-changed.json";
		before( () => {
			events = new LeanKitEvents( client, boardId, version );
			mockApiCall( mockResponseFile );
		} );

		after( () => {
			nock.cleanAll();
		} );

		it( "waitForNextUpdate should return correct event", () => {
			return testWaitForNextUpdate( eventType );
		} );

		it( "should emit correct event", ( done ) => {
			testEventEmitter( events, eventType, done );
		} );
	} );

	describe( "card moved from board event", () => {
		const eventType = "card-move-from-board";
		const mockResponseFile = "./test/test-files/card-moved-from-board.json";
		before( () => {
			events = new LeanKitEvents( client, boardId, version );
			mockApiCall( mockResponseFile );
		} );

		after( () => {
			nock.cleanAll();
		} );

		it( "waitForNextUpdate should return correct event", () => {
			return testWaitForNextUpdate( eventType );
		} );

		it( "should emit correct event", ( done ) => {
			testEventEmitter( events, eventType, done );
		} );
	} );

	describe( "card moved to board event", () => {
		const eventType = "card-move-to-board";
		const mockResponseFile = "./test/test-files/card-moved-to-board.json";
		before( () => {
			events = new LeanKitEvents( client, boardId, version );
			mockApiCall( mockResponseFile );
		} );

		after( () => {
			nock.cleanAll();
		} );

		it( "waitForNextUpdate should return correct event", () => {
			return testWaitForNextUpdate( eventType );
		} );

		it( "should emit correct event", ( done ) => {
			testEventEmitter( events, eventType, done );
		} );
	} );

	describe( "card moved event", () => {
		const eventType = "card-move";
		const mockResponseFile = "./test/test-files/card-moved.json";
		before( () => {
			events = new LeanKitEvents( client, boardId, version );
			mockApiCall( mockResponseFile );
		} );

		after( () => {
			nock.cleanAll();
		} );

		it( "waitForNextUpdate should return correct event", () => {
			return testWaitForNextUpdate( eventType );
		} );

		it( "should emit correct event", ( done ) => {
			testEventEmitter( events, eventType, done );
		} );
	} );

	describe( "card multiple user assignments event", () => {
		const eventType = "user-assignment";
		const mockResponseFile = "./test/test-files/card-multiple-user-assignments.json";
		before( () => {
			events = new LeanKitEvents( client, boardId, version );
			mockApiCall( mockResponseFile );
		} );

		after( () => {
			nock.cleanAll();
		} );

		it( "waitForNextUpdate should return correct event", () => {
			return testWaitForNextUpdate( eventType );
		} );

		it( "should emit correct event", ( done ) => {
			testEventEmitter( events, eventType, done );
		} );
	} );

	describe( "card user assigned event", () => {
		const eventType = "user-assignment";
		const mockResponseFile = "./test/test-files/card-user-assigned.json";
		before( () => {
			events = new LeanKitEvents( client, boardId, version );
			mockApiCall( mockResponseFile );
		} );

		after( () => {
			nock.cleanAll();
		} );

		it( "waitForNextUpdate should return correct event", () => {
			return testWaitForNextUpdate( eventType );
		} );

		it( "should emit correct event", ( done ) => {
			testEventEmitter( events, eventType, done );
		} );
	} );

	describe( "card user unassigned event", () => {
		const eventType = "user-assignment";
		const mockResponseFile = "./test/test-files/card-user-unassigned.json";
		before( () => {
			events = new LeanKitEvents( client, boardId, version );
			mockApiCall( mockResponseFile );
		} );

		after( () => {
			nock.cleanAll();
		} );

		it( "waitForNextUpdate should return correct event", () => {
			return testWaitForNextUpdate( eventType );
		} );

		it( "should emit correct event", ( done ) => {
			testEventEmitter( events, eventType, done );
		} );
	} );
} );
