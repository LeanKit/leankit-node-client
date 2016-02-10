let chai = require( "chai" );
let should = chai.should();
let chaiAsPromised = require( "chai-as-promised" );
chai.use( chaiAsPromised );
let when = require( "when" );

const TEST_TIMEOUT = 20000;
let fs = require( "fs" );
let _ = require( "lodash" );
import LeanKitClient from "../src/client";
let nock = require( "nock" );
let accountName = process.env.LEANKIT_ACCOUNT || "your-account-name";
let email = process.env.LEANKIT_EMAIL || "your@email.com";
let pwd = process.env.LEANKIT_PASSWORD || "p@ssw0rd";
let proxy = process.env.LEANKIT_PROXY || null;
let boardToFind = process.env.LEANKIT_TEST_BOARD || "API Test Board";
let client = null;
let boards = null;
let board = null;
let boardIdentifiers = null;
let user = null;
let cardTemplate = {
		Id: 0,
		Title: "Mocha Test Card",
		Description: "",
		TypeId: 0,
		Priority: 1,
		Size: 0,
		IsBlocked: false,
		BlockReason: "",
		DueDate: "",
		ExternalSystemName: "",
		ExternalSystemUrl: "",
		Tags: "",
		ClassOfServiceId: null,
		ExternalCardID: "",
		AssignedUserIds: [],
		UserWipOverrideComment: "Because..."
	};

// fiddler proxy: "http://127.0.0.1:8888"

let getTestBoard = () => {
	return when.promise( ( resolve, reject ) => {
		if ( !board ) {
			client.getBoards().then( ( res ) => {
				boards = res;
				let tb = boards.find( ( b ) => {
					return b.Title === boardToFind;
				} );
				return client.getBoard( tb.Id );
			} ).then( ( res ) => {
				board = res;
				user = board.BoardUsers[ 0 ];
				return client.getBoardIdentifiers( board.Id );
			} ).then( ( res ) => {
				boardIdentifiers = res;
				resolve( { board: board, boardIdentifiers: boardIdentifiers } );
			} );
		} else {
			resolve( { board: board, boardIdentifiers: boardIdentifiers } );
		}
	} );
};

let makeTestCard = ( board, boardIdentifiers ) => {
	return when.promise( ( resolve, reject ) => {
		let card = {
				Id: 0,
				Title: "Mocha Test Card",
				Description: "",
				TypeId: 0,
				Priority: 1,
				Size: 0,
				IsBlocked: false,
				BlockReason: "",
				DueDate: "",
				ExternalSystemName: "",
				ExternalSystemUrl: "",
				Tags: "",
				ClassOfServiceId: null,
				ExternalCardID: "",
				AssignedUserIds: [],
				UserWipOverrideComment: "Because..."
			};

		// Get the first active lane
		let lane = _.find( boardIdentifiers.Lanes, {
			LaneClassType: 0, Index: 0
		} );

		// Get the default card type
		let cardType = _.find( board.CardTypes, {
			IsDefault: true
		} );

		card.TypeId = cardType.Id;
		let now = new Date();
		card.Title = "Mocha test card " + now.getTime();
		card.ExternalCardID = now.getTime();

		client.addCard( board.Id, lane.Id, 0, card )
			.then( ( res ) => {
				return client.getCard( board.Id, res.CardId );
			} )
			.then( ( card ) => {
				resolve( card );
			} )
			.catch( ( err ) => {
				reject( err );
			} );
	} );
};

let removeTestCard = ( boardId, id ) => {
	return client.deleteCard( boardId, id );
};

describe( "LeanKitClient", function() {
	this.timeout( TEST_TIMEOUT );

	before( () => {
		if ( !proxy ) {
			client = new LeanKitClient( accountName, email, pwd );
		} else {
			process.env[ "NODE_TLS_REJECT_UNAUTHORIZED" ] = "0";
			client = new LeanKitClient( accountName, email, pwd, {
				proxy: proxy
			} );
		}
	} );

	describe( "Board API", () => {
		let boards = null;
		let board = null;
		it( "should return a list of boards", ( done ) => {
			client.getBoards( ( err, res ) => {
				should.not.exist( err );
				should.exist( res );
				boards = res;
				res.length.should.be.above( 0 );
				done();
			} );
		} );

		it( "should return a list of new boards", ( done ) => {
			client.getNewBoards( ( err, res ) => {
				res.length.should.be.above( 0 );
				done();
			} );
		} );

		it( "should return a valid board by ID", ( done ) => {
			client.getBoard( boards[ 0 ].Id, ( err, res ) => {
				res.Id.should.equal( boards[ 0 ].Id );
				done();
			} );
		} );

		it( "should return a valid board by name", ( done ) => {
			client.getBoardByName( boardToFind, ( err, res ) => {
				should.not.exist( err );
				should.exist( res );
				res.Title.should.equal( boardToFind );
				res.Lanes.length.should.be.above( 0 );
				board = res;
				done();
			} );
		} );

		it( "should return a valid set of board identifiers", ( done ) => {
			should.exist( board );
			client.getBoardIdentifiers( board.Id, ( err, res ) => {
				res.Lanes.length.should.be.above( 0 );
				res.CardTypes.length.should.be.above( 0 );
				done();
			} );
		} );

		it( "should return a valid set of backlog lanes", ( done ) => {
			should.exist( board );
			client.getBoardBacklogLanes( board.Id, ( err, res ) => {
				res.length.should.be.above( 0 );
				res[ 0 ].Width.should.be.above( 0 );
				done();
			} );
		} );

		it( "should return a valid set of archive lanes", ( done ) => {
			should.exist( board );
			client.getBoardArchiveLanes( board.Id, ( err, res ) => {
				res.length.should.be.above( 0 );
				res[ 0 ].Lane.Width.should.be.above( 0 );
				done();
			} );
		} );

		it( "should return cards from the archive", ( done ) => {
			should.exist( board );
			client.getBoardArchiveCards( board.Id, ( err, res ) => {
				res.length.should.be.above( 0 );
				done();
			} );
		} );
	} );

	describe( "Board Promise API", () => {
		let boards = null;
		let board = null;
		it( "should return a list of boards as a promise", ( done ) => {
			return client.getBoards().then( ( res ) => {
				should.exist( res );
				res.length.should.be.above( 0 );
				boards = res;
			}, ( err ) => {
				should.not.exist( err );
			} ).should.notify( done );
		} );

		it( "should return a list of new boards", ( done ) => {
			return client.getNewBoards().then( ( res ) => {
				res.length.should.be.above( 0 );
			}, ( err ) => {
				should.not.exist( err );
			} ).should.notify( done );
		} );

		it( "should return a valid board by ID", ( done ) => {
			return client.getBoard( boards[ 0 ].Id ).then( ( res ) => {
				res.Id.should.equal( boards[ 0 ].Id );
			}, ( err ) => {
				should.not.exist( err );
			} ).should.notify( done );
		} );

		it( "should return a valid board by name", ( done ) => {
			return client.getBoardByName( boardToFind ).then( ( res ) => {
				res.Title.should.equal( boardToFind );
				res.Lanes.length.should.be.above( 0 );
				board = res;
			}, ( err ) => {
				should.not.exist( err );
			} ).should.notify( done );
		} );

		it( "should return a valid set of board identifiers", ( done ) => {
			should.exist( board );
			return client.getBoardIdentifiers( board.Id ).then( ( res ) => {
				res.should.be.ok;
				res.Lanes.length.should.be.above( 0 );
				res.CardTypes.length.should.be.above( 0 );
				boardIdentifiers = res;
			}, ( err ) => {
				should.not.exist( err );
			} ).should.notify( done );
		} );

		it( "should return a valid set of backlog lanes", ( done ) => {
			should.exist( board );
			return client.getBoardBacklogLanes( board.Id ).then( ( res ) => {
				res.length.should.be.above( 0 );
				res[ 0 ].Width.should.be.above( 0 );
			}, ( err ) => {
				should.not.exist( err );
			} ).should.notify( done );
		} );

		it( "should return a valid set of archive lanes", ( done ) => {
			should.exist( board );
			return client.getBoardArchiveLanes( board.Id ).then( ( res ) => {
				res.length.should.be.above( 0 );
				res[ 0 ].Lane.Width.should.be.above( 0 );
			} ).should.notify( done );
		} );

		it( "should return cards from the archive", ( done ) => {
			should.exist( board );
			return client.getBoardArchiveCards( board.Id ).then( ( res ) => {
				res.length.should.be.above( 0 );
			} ).should.notify( done );
		} );
	} );

	describe( "Card API", function() {
		let testCard = null;
		let testCardId = 0;
		let board = null;
		let boardIdentifiers = null;

		before( function() {
			return getTestBoard().then( ( res ) => {
				board = res.board;
				boardIdentifiers = res.boardIdentifiers;
			} );
		} );

		after( function() {
			if ( testCardId > 0 ) {
				return removeTestCard( board.Id, testCardId );
			}
		} );

		it( "should add a card to the first active lane without error", function( done ) {
			should.exist( board );
			should.exist( boardIdentifiers );

			// Get the first active lane
			let lane = _.find( boardIdentifiers.Lanes, {
				LaneClassType: 0, Index: 0
			} );
			lane.Id.should.be.above( 0 );

			// Get the default card type
			let cardType = _.find( board.CardTypes, {
				IsDefault: true
			} );
			cardType.Id.should.be.above( 0 );

			let card = _.clone( cardTemplate );

			card.TypeId = cardType.Id;
			let now = new Date();
			card.Title = "Mocha test card " + now.getTime();
			card.ExternalCardID = now.getTime();

			client.addCard( board.Id, lane.Id, 0, card, ( err, res ) => {
				if ( err ) {
					console.log( err );
				}
				should.not.exist( err );
				should.exist( res );
				res.CardId.should.be.above( 0 );
				testCardId = res.CardId;
				done();
			} );
		} );

		it( "should add multiple cards without error", function( done ) {
			should.exist( boardIdentifiers );
			let lane = _.find( boardIdentifiers.Lanes, {
				LaneClassType: 0,
				Index: 0
			} );
			let cardType = _.find( board.CardTypes, {
				IsDefault: true
			} );
			cardType.Id.should.be.above( 0 );
			let now = new Date();
			let externalCardId = now.getTime();

			let card1 = _.clone( cardTemplate );
			card1.Id = 0;
			card1.Title = "AddCards Card 1 " + externalCardId;
			card1.ExternalCardID = externalCardId;
			card1.LaneId = lane.Id;
			card1.TypeId = cardType.Id;
			externalCardId++;

			let card2 = _.clone( card1 );
			card2.Title = "AddCards Card 2 " + externalCardId;
			card2.ExternalCardID = externalCardId;

			client.addCards( board.Id, [ card1, card2 ], function( err, res ) {
				if ( err ) {
					console.log( err );
				}
				should.exist( res );
				res.length.should.equal( 2 );
				res[ 0 ].Title.should.have.string( "AddCards" );
				done();
			} );
		} );

		it( "should return the test card by ID", ( done ) => {
			should.exist( board );
			client.getCard( board.Id, testCardId, ( err, res ) => {
				should.not.exist( err );
				should.exist( res );
				testCard = res;
				testCard.Id.should.equal( testCardId );
				done();
			} );
		} );

		it( "should return the test card by external ID", ( done ) => {
			should.exist( testCard );
			testCard.Id.should.be.above( 0 );
			client.getCardByExternalId( board.Id, testCard.ExternalCardID, ( err, res ) => {
				// console.log(res);
				should.not.exist( err );
				should.exist( res );
				// getCardByExternalId returns an array
				res.length.should.equal( 1 );
				let card = res[ 0 ];
				card.Id.should.equal( testCard.Id );
				done();
			} );
		} );

		it( "moveCard() should move card to 2nd active lane", ( done ) => {
			testCard.Id.should.be.above( 0 );
			// Find first active lane
			let lane = _.find( boardIdentifiers.Lanes, {
				LaneClassType: 0,
				LaneType: 1,
				ClassType: 0,
				Index: 0
			} );
			should.exist( lane );
			let position = 0;
			client.moveCard( board.Id, testCard.Id, lane.Id, position, "Moving card for testing...", ( err, res ) => {
				res.ReplyCode.should.equal( 202 );
				done();
			} );
		} );

		it( "moveCardByExternalId() should move card back to 1st active lane", ( done ) => {
			testCard.Id.should.be.above( 0 );
			let lane = _.find( boardIdentifiers.Lanes, {
				LaneClassType: 0,
				Index: 0
			} );
			let position = 0;
			client.moveCardByExternalId( board.Id, testCard.ExternalCardID, lane.Id, position, "Moving card for testing...", ( err, res ) => {
				res.ReplyCode.should.equal( 202 );
				done();
			} );
		} );

		it.skip( "should move card to another board", ( done ) => {
			testCard.Id.should.be.above( 0 );
			// Find a destination board
			let otherBoards = _.remove( boards, ( b ) => {
				return b.Id !== board.Id;
			} );
			let destinationBoard = otherBoards[ 0 ];
			destinationBoard.Id.should.not.equal( board.Id );

			client.moveCardToBoard( testCard.Id, destinationBoard.Id, ( err, res ) => {
				res.ReplyCode.should.equal( 202 );

				// Move it back
				client.moveCardToBoard( testCard.Id, board.Id, ( err, res ) => {
					done();
				} );
			} );
		} );

		it( "updateCard() should update a card without error", ( done ) => {
			testCard.Id.should.be.above( 0 );
			testCard.Title = "Updated test card " + testCard.ExternalCardID;
			client.updateCard( board.Id, testCard, ( err, res ) => {
				res.ReplyCode.should.equal( 202 );
				done();
			} );
		} );

		it( "updateCardFields() should update a card without error", ( done ) => {
			testCard.Id.should.be.above( 0 );
			let updateFields = {
				CardId: testCard.Id,
				Title: "Test Card update 2 " + testCard.ExternalCardID,
				Tags: "test"
			};
			client.updateCardFields( updateFields, ( err, res ) => {
				res.ReplyCode.should.equal( 202 );
				done();
			} );
		} );

		it( "updateCards() should update multiple cards without error", ( done ) => {
			should.exist( board );
			// Get the latest version of the test board
			client.getBoard( board.Id, ( err, res ) => {
				let b = res;
				let lane = _.find( b.Lanes, {
					Index: 0
				} );
				// console.log(b);
				// Filter out cards that do no start with "AddCards"
				let cards = _.remove( lane.Cards, ( card ) => {
					return card.Title && card.Title.indexOf( "AddCards" ) === 0;
				} );
				// console.log(cards);
				cards.forEach( ( card ) => {
					card.Tags = "updateCards";
					card.Priority = 2;
				} );
				client.updateCards( b.Id, cards, ( err, res ) => {
					// console.log(res);
					should.not.exist( err );
					should.exist( res );
					res.should.have.property( "UpdatedCardsCount" );
					res.UpdatedCardsCount.should.be.above( 0 );
					done();
				} );
			} );
		} );

		it( "addComment() should add a comment without error", ( done ) => {
			should.exist( testCard );
			testCard.Id.should.be.above( 0 );
			client.addComment( board.Id, testCard.Id, user.Id, "Adding a test comment.", ( err, res ) => {
				res.ReplyCode.should.equal( 202 );
				done();
			} );
		} );

		it( "addCommentByExternalId() should add a comment without error", ( done ) => {
			testCard.Id.should.be.above( 0 );
			client.addCommentByExternalId( board.Id, testCard.ExternalCardID, user.Id, "Adding a test comment by external id.", ( err, res ) => {
				res.ReplyCode.should.equal( 202 );
				done();
			} );
		} );

		it( "should get comments without error", ( done ) => {
			testCard.Id.should.be.above( 0 );
			client.getComments( board.Id, testCard.Id, ( err, res ) => {
				res.length.should.equal( 2 );
				res[ 0 ].Text.indexOf( "Adding a test comment" ).should.equal( 0 );
				done();
			} );
		} );

		it( "should get card history without error", ( done ) => {
			testCard.Id.should.be.above( 0 );
			client.getCardHistory( board.Id, testCard.Id, ( err, res ) => {
				res.length.should.be.above( 0 );
				done();
			} );
		} );

		it( "should delete test card without error", ( done ) => {
			testCard.Id.should.be.above( 0 );
			client.deleteCard( board.Id, testCard.Id, ( err, res ) => {
				res.ReplyCode.should.equal( 203 );
				testCard = null;
				testCardId = 0;
				done();
			} );
		} );

		it( "should delete multiple cards without error", ( done ) => {
			// Get the latest version of the test board
			client.getBoard( board.Id, ( err, res ) => {
				let b = res;
				let lane = _.find( b.Lanes, {
					Index: 0
				} );

				lane.should.be.ok;
				lane.Cards.length.should.be.above( 1 );

				// Filter out cards that do no start with "AddCards"
				let cards = _.remove( lane.Cards, ( card ) => {
					return card.Title ? card.Title.indexOf( "AddCards" ) === 0 : false;
				} );

				cards.length.should.be.above( 1 );

				let cardIds = _.pluck( cards, "Id" );
				client.deleteCards( board.Id, cardIds, ( err, res ) => {
					res.ReplyCode.should.equal( 203 );
					done();
				} );
			} );
		} );

		it( "should not add a card with an incorrect lane ID", ( done ) => {
			should.exist( board );
			should.exist( boardIdentifiers );

			let card = _.clone( cardTemplate );

			card.TypeId = 123; // bogus type ID
			let now = new Date();
			card.Title = "Mocha test card " + now.getTime();
			card.ExternalCardID = now.getTime();

			client.addCard( board.Id, 123, 0, card, ( err, res ) => {
				should.exist( err );
				should.not.exist( res );
				err.should.have.property( "replyCode" ).that.is.equal( 503 );
				err.should.have.property( "name" ).that.is.equal( "apiError" );
				err.should.have.property( "replyText" ).to.include( "The Lane specified" );
				err.should.have.property( "replyData" );
				done();
			} );
		} );
	} );

	describe( "Card Promise API", function() {
		let testCard = null;
		let testCardId = 0;
		let board = null;
		let boardIdentifiers = null;

		before( function() {
			return getTestBoard().then( ( res ) => {
				board = res.board;
				boardIdentifiers = res.boardIdentifiers;
			} );
		} );

		after( function() {
			if ( testCardId > 0 ) {
				return removeTestCard( board.Id, testCardId );
			}
		} );

		it( "should not add a card with an incorrect lane ID", ( done ) => {
			should.exist( board );
			should.exist( boardIdentifiers );

			let card = _.clone( cardTemplate );

			card.TypeId = 123; // bogus type ID
			let now = new Date();
			card.Title = "Mocha test card " + now.getTime();
			card.ExternalCardID = now.getTime();

			client.addCard( board.Id, 123, 0, card ).then( ( res ) => {
				should.not.exist( res );
				done();
			} ).catch( err => {
				should.exist( err );
				err.should.have.property( "replyCode" ).that.is.equal( 503 );
				err.should.have.property( "name" ).that.is.equal( "apiError" );
				err.should.have.property( "replyText" ).to.include( "The Lane specified" );
				err.should.have.property( "replyData" );
				done();
			} );
		} );

		it( "should add a card to the first active lane without error", function( done ) {
			should.exist( board );
			should.exist( boardIdentifiers );

			// Get the first active lane
			let lane = _.find( boardIdentifiers.Lanes, {
				LaneClassType: 0, Index: 0
			} );
			lane.Id.should.be.above( 0 );

			// Get the default card type
			let cardType = _.find( board.CardTypes, {
				IsDefault: true
			} );
			cardType.Id.should.be.above( 0 );

			let card = _.clone( cardTemplate );

			card.TypeId = cardType.Id;
			let now = new Date();
			card.Title = "Mocha test card " + now.getTime();
			card.ExternalCardID = now.getTime();

			return client.addCard( board.Id, lane.Id, 0, card ).then( ( res ) => {
				should.exist( res );
				res.CardId.should.be.above( 0 );
				testCardId = res.CardId;
			}, ( err ) => {
				console.error( err );
				should.not.exist( err );
			} ).should.notify( done );
		} );

		it( "should add multiple cards without error", function( done ) {
			should.exist( boardIdentifiers );
			let lane = _.find( boardIdentifiers.Lanes, {
				LaneClassType: 0,
				Index: 0
			} );
			let cardType = _.find( board.CardTypes, {
				IsDefault: true
			} );
			cardType.Id.should.be.above( 0 );
			let now = new Date();
			let externalCardId = now.getTime();

			let card1 = _.clone( cardTemplate );
			card1.Id = 0;
			card1.Title = "AddCards Card 1 " + externalCardId;
			card1.ExternalCardID = externalCardId;
			card1.LaneId = lane.Id;
			card1.TypeId = cardType.Id;
			externalCardId++;

			let card2 = _.clone( card1 );
			card2.Title = "AddCards Card 2 " + externalCardId;
			card2.ExternalCardID = externalCardId;

			return client.addCards( board.Id, [ card1, card2 ] ).then( ( res ) => {
				should.exist( res );
				res.length.should.equal( 2 );
				res[ 0 ].Title.should.have.string( "AddCards" );
			}, ( err ) => {
				console.error( err );
				should.not.exist( err );
			} ).should.notify( done );
		} );

		it( "should return the test card by ID", ( done ) => {
			should.exist( board );
			return client.getCard( board.Id, testCardId ).then( ( res ) => {
				testCard = res;
				testCard.Id.should.equal( testCardId );
			}, ( err ) => {
				console.error( err );
				should.not.exist( err );
			} ).should.notify( done );
		} );

		it( "should return the test card by external ID", ( done ) => {
			should.exist( testCard );
			testCard.Id.should.be.above( 0 );
			return client.getCardByExternalId( board.Id, testCard.ExternalCardID ).then( ( res ) => {
				should.exist( res );
				// getCardByExternalId returns an array
				res.length.should.equal( 1 );
				let card = res[ 0 ];
				card.Id.should.equal( testCard.Id );
			}, ( err ) => {
				console.error( err );
				should.not.exist( err );
			} ).should.notify( done );
		} );

		it( "moveCard() should move card to 2nd active lane", ( done ) => {
			testCard.Id.should.be.above( 0 );
			// Find first active lane
			let lane = _.find( boardIdentifiers.Lanes, {
				LaneClassType: 0,
				LaneType: 1,
				ClassType: 0,
				Index: 0
			} );
			should.exist( lane );
			let position = 0;
			client.moveCard( board.Id, testCard.Id, lane.Id, position, "Moving card for testing..." ).then( ( res ) => {
				res.ReplyCode.should.equal( 202 );
			}, ( err ) => {
				console.error( err );
				should.not.exist( err );
			} ).should.notify( done );
		} );

		it( "moveCardByExternalId() should move card back to 1st active lane", ( done ) => {
			testCard.Id.should.be.above( 0 );
			let lane = _.find( boardIdentifiers.Lanes, {
				LaneClassType: 0,
				Index: 0
			} );
			let position = 0;
			return client.moveCardByExternalId( board.Id, testCard.ExternalCardID, lane.Id, position, "Moving card for testing..." ).then( ( res ) => {
				res.ReplyCode.should.equal( 202 );
			}, ( err ) => {
				console.error( err );
				should.not.exist( err );
			} ).should.notify( done );
		} );

		it.skip( "should move card to another board", ( done ) => {
			testCard.Id.should.be.above( 0 );
			// Find a destination board
			let otherBoards = _.remove( boards, ( b ) => {
				return b.Id !== board.Id;
			} );
			let destinationBoard = otherBoards[ 0 ];
			destinationBoard.Id.should.not.equal( board.Id );

			return client.moveCardToBoard( testCard.Id, destinationBoard.Id ).then( ( res ) => {
				res.ReplyCode.should.equal( 202 );

				// Move it back
				return client.moveCardToBoard( testCard.Id, board.Id );
			}, ( err ) => {
				console.error( err );
				should.not.exist( err );
			} ).should.notify( done );
		} );

		it( "updateCard() should update a card without error", ( done ) => {
			testCard.Id.should.be.above( 0 );
			testCard.Title = "Updated test card " + testCard.ExternalCardID;
			return client.updateCard( board.Id, testCard ).then( ( res ) => {
				res.ReplyCode.should.equal( 202 );
			}, ( err ) => {
				console.error( err );
				should.not.exist( err );
			} ).should.notify( done );
		} );

		it( "updateCardFields() should update a card without error", ( done ) => {
			testCard.Id.should.be.above( 0 );
			let updateFields = {
				CardId: testCard.Id,
				Title: "Test Card update 2 " + testCard.ExternalCardID,
				Tags: "test"
			};
			return client.updateCardFields( updateFields ).then( ( res ) => {
				res.ReplyCode.should.equal( 202 );
			}, ( err ) => {
				console.error( err );
				should.not.exist( err );
			} ).should.notify( done );
		} );

		it( "updateCards() should update multiple cards without error", ( done ) => {
			should.exist( board );
			// Get the latest version of the test board
			return client.getBoard( board.Id ).then( ( res ) => {
				let b = res;
				let lane = _.find( b.Lanes, {
					Index: 0
				} );

				// Filter out cards that do no start with "AddCards"
				let cards = _.remove( lane.Cards, ( card ) => {
					return card.Title && card.Title.indexOf( "AddCards" ) === 0;
				} );

				cards.forEach( ( card ) => {
					card.Tags = "updateCards";
					card.Priority = 2;
				} );
				return client.updateCards( b.Id, cards ).then( ( res ) => {
					should.exist( res );
					res.should.have.property( "UpdatedCardsCount" );
					res.UpdatedCardsCount.should.be.above( 0 );
				}, ( err ) => {
					console.error( err );
					should.not.exist( err );
				} ).should.notify( done );
			} );
		} );

		it( "addComment() should add a comment without error", ( done ) => {
			testCard.Id.should.be.above( 0 );
			return client.addComment( board.Id, testCard.Id, user.Id, "Adding a test comment." ).then( ( res ) => {
				res.ReplyCode.should.equal( 202 );
			}, ( err ) => {
				console.error( err );
				should.not.exist( err );
			} ).should.notify( done );
		} );

		it( "addCommentByExternalId() should add a comment without error", ( done ) => {
			testCard.Id.should.be.above( 0 );
			return client.addCommentByExternalId( board.Id, testCard.ExternalCardID, user.Id, "Adding a test comment by external id." ).then( ( res ) => {
				res.ReplyCode.should.equal( 202 );
			}, ( err ) => {
				console.error( err );
				should.not.exist( err );
			} ).should.notify( done );
		} );

		it( "should get comments without error", ( done ) => {
			testCard.Id.should.be.above( 0 );
			return client.getComments( board.Id, testCard.Id ).then( ( res ) => {
				res.length.should.equal( 2 );
				res[ 0 ].Text.indexOf( "Adding a test comment" ).should.equal( 0 );
			}, ( err ) => {
				console.error( err );
				should.not.exist( err );
			} ).should.notify( done );
		} );

		it( "should get card history without error", ( done ) => {
			testCard.Id.should.be.above( 0 );
			return client.getCardHistory( board.Id, testCard.Id ).then( ( res ) => {
				res.length.should.be.above( 0 );
			}, ( err ) => {
				console.error( err );
				should.not.exist( err );
			} ).should.notify( done );
		} );

		it( "should delete test card without error", ( done ) => {
			testCard.Id.should.be.above( 0 );
			return client.deleteCard( board.Id, testCard.Id ).then( ( res ) => {
				res.ReplyCode.should.equal( 203 );
				testCard = null;
				testCardId = 0;
			}, ( err ) => {
				console.error( err );
				should.not.exist( err );
			} ).should.notify( done );
		} );

		it( "should delete multiple cards without error", ( done ) => {
			// Get the latest version of the test board
			return client.getBoard( board.Id ).then( ( res ) => {
				let b = res;
				let lane = _.find( b.Lanes, {
					Index: 0
				} );

				lane.should.be.ok;
				lane.Cards.length.should.be.above( 1 );

				// Filter out cards that do no start with "AddCards"
				let cards = _.remove( lane.Cards, ( card ) => {
					return card.Title ? card.Title.indexOf( "AddCards" ) === 0 : false;
				} );

				cards.length.should.be.above( 1 );

				let cardIds = _.pluck( cards, "Id" );
				return client.deleteCards( board.Id, cardIds ).then( ( res ) => {
					res.ReplyCode.should.equal( 203 );
				}, ( err ) => {
					console.error( err );
					should.not.exist( err );
				} ).should.notify( done );
			} );
		} );
	} );

	describe( "Card Attachments API", () => {
		let testCard = null;
		let testCardId = 0;
		let board = null;
		let attachment = null;

		before( function() {
			fs.writeFile( "./test/testfile.txt", "test file" );
			return getTestBoard().then( ( res ) => {
				board = res.board;
				return makeTestCard( res.board, res.boardIdentifiers );
			} ).then( ( card ) => {
				testCard = card;
				testCardId = card.Id;
			} );
		} );

		after( function() {
			fs.unlink( "./test/testfile.txt" );
			fs.unlink( "./test/download.txt" );
			if ( testCardId > 0 ) {
				return removeTestCard( board.Id, testCardId );
			}
		} );

		it( "should add attachment without error", ( done ) => {
			testCard.Id.should.be.above( 0 );
			let file = fs.createReadStream( "./test/testfile.txt" );
			client.addAttachment( board.Id, testCard.Id, "Test Attachment", file, ( err, res ) => {
				if ( err ) {
					console.log( "err:", err );
				}
				should.not.exist( err );
				should.exist( res );
				res.should.have.property( "ReplyCode" );
				res.ReplyCode.should.equal( 202 );
				done();
			} );
		} );

		it( "should get attachments without error", ( done ) => {
			testCard.Id.should.be.above( 0 );
			client.getAttachments( board.Id, testCard.Id, ( err, res ) => {
				if ( err ) {
					console.log( "err:", err );
				}
				should.not.exist( err );
				should.exist( res );
				res.should.be.instanceOf( Array );
				res.length.should.be.above( 0 );
				res[ 0 ].should.have.property( "FileName" );
				res[ 0 ].should.have.property( "Description" );
				attachment = res[ 0 ];
				done();
			} );
		} );

		it( "should get attachment by ID without error", ( done ) => {
			testCard.Id.should.be.above( 0 );
			should.exist( attachment );
			attachment.should.have.property( "Id" );
			client.getAttachment( board.Id, testCard.Id, attachment.Id, ( err, res ) => {
				should.not.exist( err );
				should.exist( res );
				res.should.have.property( "Id" );
				res.should.have.property( "FileName" );
				res.should.have.property( "Description" );
				done();
			} );
		} );

		it( "should get attachment count without error", ( done ) => {
			testCard.Id.should.be.above( 0 );
			client.getAttachmentCount( board.Id, testCard.Id, ( err, res ) => {
				should.not.exist( err );
				should.exist( res );
				res.should.be.above( 0 );
				// console.log(res);
				done();
			} );
		} );

		it( "should download attachment without error", ( done ) => {
			should.exist( attachment );
			attachment.should.have.property( "Id" );
			let fileName = "./test/download.txt";
			client.downloadAttachment( board.Id, attachment.Id, fileName, ( err, res ) => {
				should.not.exist( err );
				should.exist( res );
				fs.readFile( fileName, "utf8", ( err, text ) => {
					should.not.exist( err );
					should.exist( text );
					text.should.equal( "test file" );
					done();
				} );
			} );
		} );

		it( "should download attachment to stream without error", ( done ) => {
			should.exist( attachment );
			attachment.should.have.property( "Id" );
			let fileName = "./test/download.txt";
			let file = fs.createWriteStream( fileName );
			client.downloadAttachment( board.Id, attachment.Id, file, ( err, res ) => {
				should.not.exist( err );
				should.exist( res );
				fs.readFile( fileName, "utf8", ( err, text ) => {
					should.not.exist( err );
					should.exist( text );
					text.should.equal( "test file" );
					done();
				} );
			} );
		} );

		it( "should delete attachment without error", ( done ) => {
			should.exist( attachment );
			attachment.should.have.property( "Id" );
			client.deleteAttachment( board.Id, testCard.Id, attachment.Id, ( err, res ) => {
				should.not.exist( err );
				should.exist( res );
				res.should.have.property( "ReplyCode" );
				res.ReplyCode.should.equal( 203 );
				done();
			} );
		} );
	} );

	describe( "Card Attachments Promise API", () => {
		let testCard = null;
		let testCardId = 0;
		let board = null;
		let attachment = null;

		before( function() {
			fs.writeFile( "./test/testfile.txt", "test file" );
			return getTestBoard().then( ( res ) => {
				board = res.board;
				return makeTestCard( res.board, res.boardIdentifiers );
			} ).then( ( card ) => {
				testCard = card;
				testCardId = card.Id;
			} );
		} );

		after( function() {
			fs.unlink( "./test/testfile.txt" );
			fs.unlink( "./test/download.txt" );
			if ( testCardId > 0 ) {
				return removeTestCard( board.Id, testCardId );
			}
		} );

		it( "should add attachment without error", ( done ) => {
			testCard.Id.should.be.above( 0 );
			let file = fs.createReadStream( "./test/testfile.txt" );
			return client.addAttachment( board.Id, testCard.Id, "Test Attachment", file ).then( ( res ) => {
				should.exist( res );
				res.should.have.property( "ReplyCode" );
				res.ReplyCode.should.equal( 202 );
			}, ( err ) => {
				console.error( err );
				should.not.exist( err );
			} ).should.notify( done );
		} );

		it( "should get attachments without error", ( done ) => {
			testCard.Id.should.be.above( 0 );
			return client.getAttachments( board.Id, testCard.Id ).then( ( res ) => {
				should.exist( res );
				res.should.be.instanceOf( Array );
				res.length.should.be.above( 0 );
				res[ 0 ].should.have.property( "FileName" );
				res[ 0 ].should.have.property( "Description" );
				attachment = res[ 0 ];
			}, ( err ) => {
				console.error( err );
				should.not.exist( err );
			} ).should.notify( done );
		} );

		it( "should get attachment by ID without error", ( done ) => {
			testCard.Id.should.be.above( 0 );
			should.exist( attachment );
			attachment.should.have.property( "Id" );
			return client.getAttachment( board.Id, testCard.Id, attachment.Id ).then( ( res ) => {
				should.exist( res );
				res.should.have.property( "Id" );
				res.should.have.property( "FileName" );
				res.should.have.property( "Description" );
			}, ( err ) => {
				console.error( err );
				should.not.exist( err );
			} ).should.notify( done );
		} );

		it( "should get attachment count without error", ( done ) => {
			testCard.Id.should.be.above( 0 );
			return client.getAttachmentCount( board.Id, testCard.Id ).then( ( res ) => {
				should.exist( res );
				res.should.be.above( 0 );
			}, ( err ) => {
				console.error( err );
				should.not.exist( err );
			} ).should.notify( done );
		} );

		it( "should download attachment without error", ( done ) => {
			should.exist( attachment );
			attachment.should.have.property( "Id" );
			let fileName = "./test/download.txt";
			return client.downloadAttachment( board.Id, attachment.Id, fileName ).then( ( res ) => {
				should.exist( res );
				fs.readFile( fileName, "utf8", ( err, text ) => {
					should.not.exist( err );
					should.exist( text );
					text.should.equal( "test file" );
					done();
				} );
			} );
		} );

		it( "should download attachment to stream without error", ( done ) => {
			should.exist( attachment );
			attachment.should.have.property( "Id" );
			let fileName = "./test/download.txt";
			let file = fs.createWriteStream( fileName );
			return client.downloadAttachment( board.Id, attachment.Id, file ).then( ( res ) => {
				should.exist( res );
				fs.readFile( fileName, "utf8", ( err, text ) => {
					should.not.exist( err );
					should.exist( text );
					text.should.equal( "test file" );
					done();
				} );
			} );
		} );

		it( "should delete attachment without error", ( done ) => {
			should.exist( attachment );
			attachment.should.have.property( "Id" );
			return client.deleteAttachment( board.Id, testCard.Id, attachment.Id ).then( ( res ) => {
				should.exist( res );
				res.should.have.property( "ReplyCode" );
				res.ReplyCode.should.equal( 203 );
			}, ( err ) => {
				console.error( err );
				should.not.exist( err );
			} ).should.notify( done );
		} );
	} );

	describe( "Task Board/Card API", () => {
		let testCard = null;
		let testCardId = 0;
		let board = null;
		let taskBoard = null;
		let taskCard = null;

		before( function() {
			return getTestBoard().then( ( res ) => {
				board = res.board;
				return makeTestCard( res.board, res.boardIdentifiers );
			} ).then( ( card ) => {
				testCard = card;
				testCardId = card.Id;
			} );
		} );

		after( function() {
			if ( testCardId > 0 ) {
				return removeTestCard( board.Id, testCardId );
			}
		} );

		it( "addTask() should add a task to a card taskboard", ( done ) => {
			testCard.Id.should.be.above( 0 );
			// Get the default task card type
			let cardType = _.find( board.CardTypes, {
				IsDefaultTaskType: true
			} );
			cardType.Id.should.be.above( 0 );
			taskCard = { Title: "Task Card 1", LaneId: 0, Index: 0, TypeId: cardType.Id };

			client.addTask( board.Id, testCard.Id, taskCard, ( err, res ) => {
				res.CardId.should.be.above( 0 );
				done();
			} );
		} );

		it( "getTaskboard() should get the card taskboard", ( done ) => {
			testCard.Id.should.be.above( 0 );
			client.getTaskboard( board.Id, testCard.Id, ( err, res ) => {
				taskBoard = res;
				taskBoard.Id.should.be.above( 0 );
				taskBoard.Lanes.length.should.equal( 3 );
				taskCard = taskBoard.Lanes[ 0 ].Cards[ 0 ];
				// console.log(taskBoard);
				done();
			} );
		} );

		it( "updateTask() should update a task on a card taskboard", ( done ) => {
			testCard.Id.should.be.above( 0 );
			taskCard.Title = "Updated task 1";

			client.updateTask( board.Id, testCard.Id, taskCard, ( err, res ) => {
				res.ReplyCode.should.equal( 202 );
				done();
			} );
		} );

		it( "moveTask() should move a task on a card taskboard", ( done ) => {
			testCard.Id.should.be.above( 0 );
			let lane = _.find( taskBoard.Lanes, {
				Index: 1
			} );
			let position = 0;
			client.moveTask( board.Id, testCard.Id, taskCard.Id, lane.Id, position, ( err, res ) => {
				res.ReplyCode.should.equal( 202 );
				done();
			} );
		} );

		it( "getTaskBoardUpdates() should get the latest taskboard", ( done ) => {
			testCard.Id.should.be.above( 0 );
			client.getTaskBoardUpdates( board.Id, testCard.Id, 0, ( err, res ) => {
				// console.log(err);
				// console.log(res);
				should.not.exist( err );
				should.exist( res );
				res.HasUpdates.should.be.true;
				res.AffectedLanes.length.should.be.above( 0 );
				res.Events.length.should.be.above( 0 );
				res.CurrentBoardVersion.should.be.above( 1 );
				done();
			} );
		} );

		it( "deleteTask() should delete a task on a card taskboard", ( done ) => {
			testCard.Id.should.be.above( 0 );
			client.deleteTask( board.Id, testCard.Id, taskCard.Id, ( err, res ) => {
				res.ReplyCode.should.equal( 203 );
				done();
			} );
		} );
	} );

	describe( "Task Board/Card Promise API", () => {
		let testCard = null;
		let testCardId = 0;
		let board = null;
		let taskBoard = null;
		let taskCard = null;

		before( function() {
			return getTestBoard().then( ( res ) => {
				board = res.board;
				return makeTestCard( res.board, res.boardIdentifiers );
			} ).then( ( card ) => {
				testCard = card;
				testCardId = card.Id;
			} );
		} );

		after( function() {
			if ( testCardId > 0 ) {
				return removeTestCard( board.Id, testCardId );
			}
		} );

		it( "addTask() should add a task to a card taskboard", () => {
			testCard.Id.should.be.above( 0 );
			// Get the default task card type
			let cardType = _.find( board.CardTypes, {
				IsDefaultTaskType: true
			} );
			cardType.Id.should.be.above( 0 );
			taskCard = { Title: "Task Card 1", LaneId: 0, Index: 0, TypeId: cardType.Id };

			return client.addTask( board.Id, testCard.Id, taskCard )
				.should.eventually.have.property( "CardId" ).that.is.above( 0 );
		} );

		it( "getTaskboard() should get the card taskboard", ( done ) => {
			testCard.Id.should.be.above( 0 );
			return client.getTaskboard( board.Id, testCard.Id ).then( ( res ) => {
				taskBoard = res;
				taskBoard.Id.should.be.above( 0 );
				taskBoard.Lanes.length.should.equal( 3 );
				taskCard = taskBoard.Lanes[ 0 ].Cards[ 0 ];
			}, ( err ) => {
				console.error( err );
				should.not.exist( err );
			} ).should.notify( done );
		} );

		it( "updateTask() should update a task on a card taskboard", () => {
			testCard.Id.should.be.above( 0 );
			taskCard.Title = "Updated task 1";

			return client.updateTask( board.Id, testCard.Id, taskCard )
				.should.eventually.have.property( "ReplyCode" ).that.equals( 202 );
		} );

		it( "moveTask() should move a task on a card taskboard", () => {
			testCard.Id.should.be.above( 0 );
			let lane = _.find( taskBoard.Lanes, {
				Index: 1
			} );
			let position = 0;
			return client.moveTask( board.Id, testCard.Id, taskCard.Id, lane.Id, position )
				.should.eventually.have.property( "ReplyCode" ).that.equals( 202 );
		} );

		it( "getTaskBoardUpdates() should get the latest taskboard", ( done ) => {
			testCard.Id.should.be.above( 0 );
			return client.getTaskBoardUpdates( board.Id, testCard.Id, 0 ).then( ( res ) => {
				should.exist( res );
				res.HasUpdates.should.be.true;
				res.AffectedLanes.length.should.be.above( 0 );
				res.Events.length.should.be.above( 0 );
				res.CurrentBoardVersion.should.be.above( 1 );
			}, ( err ) => {
				console.error( err );
				should.not.exist( err );
			} ).should.notify( done );
		} );

		it( "deleteTask() should delete a task on a card taskboard", () => {
			testCard.Id.should.be.above( 0 );
			return client.deleteTask( board.Id, testCard.Id, taskCard.Id )
				.should.eventually.have.property( "ReplyCode" ).that.equals( 203 );
		} );
	} );

	describe( "Search API", () => {
		let board = null;

		before( () => {
			return getTestBoard().then( ( res ) => {
				board = res.board;
			} );
		} );

		it( "searchCards() should get cards without error", ( done ) => {
			let searchOptions = {
				IncludeArchiveOnly: false,
				IncludeBacklogOnly: false,
				IncludeComments: false,
				IncludeDescription: false,
				IncludeExternalId: false,
				IncludeTags: false,
				AddedAfter: null,
				AddedBefore: null,
				CardTypeIds: [],
				ClassOfServiceIds: [],
				Page: 1,
				MaxResults: 20,
				OrderBy: "CreatedOn",
				SortOrder: 0
			};
			client.searchCards( board.Id, searchOptions, ( err, res ) => {
				should.not.exist( err );
				should.exist( res );
				res.should.have.property( "Results" );
				res.should.have.property( "TotalResults" );
				res.should.have.property( "Page" );
				res.should.have.property( "MaxResults" );
				done();
			} );
		} );

		it( "promise version of searchCards() should get cards without error", () => {
			let searchOptions = {
				IncludeArchiveOnly: false,
				IncludeBacklogOnly: false,
				IncludeComments: false,
				IncludeDescription: false,
				IncludeExternalId: false,
				IncludeTags: false,
				AddedAfter: null,
				AddedBefore: null,
				CardTypeIds: [],
				ClassOfServiceIds: [],
				Page: 1,
				MaxResults: 20,
				OrderBy: "CreatedOn",
				SortOrder: 0
			};
			return client.searchCards( board.Id, searchOptions ).then( ( res ) => {
				should.exist( res );
				res.should.have.property( "Results" );
				res.should.have.property( "TotalResults" );
				res.should.have.property( "Page" );
				res.should.have.property( "MaxResults" );
			} );
		} );
	} );

	describe( "Board Updates API", () => {
		let board = null;

		before( () => {
			return getTestBoard().then( ( res ) => {
				board = res.board;
			} );
		} );

		it( "getNewCards() should get cards without error", ( done ) => {
			client.getNewCards( board.Id, ( err, res ) => {
				should.not.exist( err );
				should.exist( res );
				res.should.be.instanceOf( Array );
				if ( res.length > 0 ) {
					res[ 0 ].should.have.property( "Id" );
					res[ 0 ].should.have.property( "LaneId" );
					res[ 0 ].should.have.property( "TypeName" );
				}
				done();
			} );
		} );

		it( "getNewerIfExists() should return a newer board", ( done ) => {
			var version = board.Version - 1;
			client.getNewerIfExists( board.Id, version, ( err, res ) => {
				should.not.exist( err );
				should.exist( res );
				res.Version.should.be.above( version );
				done();
			} );
		} );

		it( "getBoardHistorySince() should return newer cards", ( done ) => {
			var version = board.Version - 1;
			client.getBoardHistorySince( board.Id, version, ( err, res ) => {
				should.not.exist( err );
				should.exist( res );
				res.should.be.instanceOf( Array );
				res.length.should.be.above( 0 );
				res[ 0 ].should.have.property( "CardId" );
				res[ 0 ].should.have.property( "EventType" );
				done();
			} );
		} );

		it( "getBoardUpdates() should return all recent updates", ( done ) => {
			var version = board.Version - 1;
			client.getBoardUpdates( board.Id, version, ( err, res ) => {
				res.HasUpdates.should.be.true;
				res.AffectedLanes.length.should.be.above( 0 );
				res.Events.length.should.be.above( 0 );
				done();
			} );
		} );
	} );

	describe( "Board Updates Promises API", () => {
		let board = null;

		before( () => {
			return getTestBoard().then( ( res ) => {
				board = res.board;
			} );
		} );

		it( "getNewCards() should get cards without error", ( done ) => {
			return client.getNewCards( board.Id ).then( ( res ) => {
				should.exist( res );
				res.should.be.instanceOf( Array );
				if ( res.length > 0 ) {
					res[ 0 ].should.have.property( "Id" );
					res[ 0 ].should.have.property( "LaneId" );
					res[ 0 ].should.have.property( "TypeName" );
				}
			}, ( err ) => {
				should.not.exist( err );
			} ).should.notify( done );
		} );

		it( "getNewerIfExists() should return a newer board", () => {
			var version = board.Version - 1;
			return client.getNewerIfExists( board.Id, version )
				.should.eventually.have.property( "Version" )
				.that.is.above( version );
		} );

		it( "getBoardHistorySince() should return newer cards", ( done ) => {
			var version = board.Version - 1;
			client.getBoardHistorySince( board.Id, version ).then( ( res ) => {
				should.exist( res );
				res.should.be.instanceOf( Array );
				res.length.should.be.above( 0 );
				res[ 0 ].should.have.property( "CardId" );
				res[ 0 ].should.have.property( "EventType" );
			}, ( err ) => {
				should.not.exist( err );
			} ).should.notify( done );
		} );

		it( "getBoardUpdates() should return all recent updates", ( done ) => {
			var version = board.Version - 1;
			client.getBoardUpdates( board.Id, version ).then( ( res ) => {
				res.HasUpdates.should.be.true;
				res.AffectedLanes.length.should.be.above( 0 );
				res.Events.length.should.be.above( 0 );
			}, ( err ) => {
				should.not.exist( err );
			} ).should.notify( done );
		} );
	} );

	describe( "Errors", () => {
		beforeEach( () => {
			let url = accountName.startsWith( "http" ) ?
				accountName :
				"https://" + accountName + ".leankit.com";

			nock( url )
				.get( "/kanban/api/boards" )
				.reply( 200, {
					ReplyData: [ {
						Resource: "GET /kanban/api/boards",
						UserAddress: "127.0.0.1",
						Headers: {}
					} ],
					ReplyCode: 503,
				ReplyText: "Some useful message here." } );
		} );
		afterEach( () => {
			nock.cleanAll();
		} );

		it( "should invoke callback with error arg when API replies with 200 OK + ReplyCode not 2xx", ( done ) => {
			return client.getBoards( ( err, res ) => {
				should.exist( err );
				should.not.exist( res );
				err.should.have.property( "replyCode" ).that.is.equal( 503 );
				done();
			} );
		} );

		it( "should handle promise rejection", () => {
			return client.getBoards()
				.then( ( res ) => {
					"this".should.not.equal( "this" );
					should.not.exist( res );
				}, ( err ) => {
					should.exist( err );
					err.should.have.property( "replyCode" ).that.is.equal( 503 );
				} );
		} );

		it( "should handle another promise rejection", () => {
			return client.getBoards()
				.then( ( res ) => {
					"this".should.not.equal( "this" );
					should.not.exist( res );
				}, ( err ) => {
					should.exist( err );
					err.should.have.property( "replyCode" ).that.is.equal( 503 );
				} );
		} );
	} );

	describe( "Client", () => {
		it( "should let you bypass user/pass in favor of headers", ( done ) => {
			let credentials = new Buffer( email + ":" + pwd ).toString( "base64" );
			let opts = {
				headers: {
					authorization: "Basic " + credentials
				}
			};

			let client = new LeanKitClient( accountName, opts );

			client.getBoards( ( err, res ) => {
				should.not.exist( err );
				should.exist( res );
				boards = res;
				boards.length.should.be.above( 0 );
				done();
			} );
		} );

		it( "builds the correct url from a given account name", () => {
			let client = new LeanKitClient( "account", "me@mycompany.com", "test" );
			client._options.baseUrl.should.equal( "https://account.leankit.com/" );
		} );

		it( "builds the correct url from a given account domain name", () => {
			let client = new LeanKitClient( "accountname.leankit.com", "me@mycompany.com", "test" );
			client._options.baseUrl.should.equal( "https://accountname.leankit.com/" );
		} );

		it( "builds the correct url from a given url", () => {
			let client = new LeanKitClient( "https://mycompany.leankit.com", "me@mycompany.com", "test" );
			client._options.baseUrl.should.equal( "https://mycompany.leankit.com/" );
		} );
	} );

	describe( "User Profile", () => {
		it( "retrieves the current user's profile", ()=> {
			return client.getCurrentUserProfile()
				.then( ( user ) => {
					should.exist( user );
					user.should.have.property( "Id" );
					user.should.have.property( "FirstName" );
					user.should.have.property( "LastName" );
					user.should.have.property( "EmailAddress" );
					user.should.have.property( "DateFormat" );
					user.should.have.property( "TimeZone" );
				} );
		} );
	} );
} );
