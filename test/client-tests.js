var fs = require( "fs" );
var _ = require( "lodash" );
var should = require( "should" );
var LeanKitClient = require( "../leankit-client" );
var nock = require( "nock" );
var accountName = process.env.LEANKIT_ACCOUNT || "your-account-name";
var email = process.env.LEANKIT_EMAIL || "your@email.com";
var pwd = process.env.LEANKIT_PASSWORD || "p@ssw0rd";

var client = {},
	boards = [],
	boardToFind = process.env.LEANKIT_TEST_BOARD || "API Test Board",
	boardIdentifiers = {},
	board = {},
	user = {},
	testCard = {
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
		ExternalCardId: "",
		AssignedUserIds: [],
		UserWipOverrideComment: "Because..."
	},
	taskBoard = {},
	taskCard = {},
	attachment = {};

if ( accountName !== "kanban-cibuild" ) {
	client = LeanKitClient.createClient( accountName, email, pwd );
} else {
	process.env.NODE.TLS.REJECT.UNAUTHORIZED = "0" ; //[ "NODE_TLS_REJECT_UNAUTHORIZED" ] = "0";
	client = LeanKitClient.createClient( accountName, email, pwd, {
		"proxy": "http://127.0.0.1:8888"
	} );
}

describe( "LeanKitClient", function() {
	this.timeout( 10000 );

	describe( "Board API", function() {
		it( "should return a list of boards", function( done ) {
			client.getBoards( function( err, res ) {
				should.not.exist( err );
				should.exist( res );
				boards = res;
				boards.length.should.be.above( 0 );
				done();
			} );
		} );

		it( "should return a list of new boards", function( done ) {
			client.getNewBoards( function( err, res ) {
				res.length.should.be.above( 0 );
				done();
			} );
		} );

		it( "should return a valid board by ID", function( done ) {
			client.getBoard( boards[ 0 ].Id, function( err, res ) {
				res.Id.should.equal( boards[ 0 ].Id );
				done();
			} );
		} );

		it( "should return a valid board by name", function( done ) {
			client.getBoardByName( boardToFind, function( err, res ) {
				board = res;
				board.Title.should.equal( boardToFind );
				board.BoardUsers.length.should.be.above( 0 );
				user = board.BoardUsers[ 0 ];
				done();
			} );
		} );

		it( "should return a valid set of board identifiers", function( done ) {
			should.exist( board );
			client.getBoardIdentifiers( board.Id, function( err, res ) {
				res.Lanes.length.should.be.above( 0 );
				res.CardTypes.length.should.be.above( 0 );
				boardIdentifiers = res;
				done();
			} );
		} );

		it( "should return a valid set of backlog lanes", function( done ) {
			should.exist( board );
			client.getBoardBacklogLanes( board.Id, function( err, res ) {
				res.length.should.be.above( 0 );
				res[ 0 ].Width.should.be.above( 0 );
				done();
			} );
		} );

		it( "should return a valid set of archive lanes", function( done ) {
			should.exist( board );
			client.getBoardArchiveLanes( board.Id, function( err, res ) {
				res.length.should.be.above( 0 );
				res[ 0 ].Lane.Width.should.be.above( 0 );
				done();
			} );
		} );

		it( "should return cards from the archive", function( done ) {
			should.exist( board );
			client.getBoardArchiveCards( board.Id, function( err, res ) {
				res.length.should.be.above( 0 );
				done();
			} );
		} );
	} );

	describe( "Card API", function() {

		it( "should add a card to the first active lane without error", function( done ) {
			should.exist( board );
			should.exist( boardIdentifiers );

			// Get the first active lane
			var lane = _.find( boardIdentifiers.Lanes, {
				"LaneClassType": 0,
				"Index": 0
			} );
			lane.Id.should.be.above( 0 );

			// Get the default card type
			var cardType = _.find( board.CardTypes, {
				"IsDefault": true
			} );
			cardType.Id.should.be.above( 0 );

			testCard.TypeId = cardType.Id;
			var now = new Date();
			testCard.Title = "Mocha test card " + now.getTime();
			testCard.ExternalCardId = now.getTime();

			client.addCard( board.Id, lane.Id, 0, testCard, function( err, res ) {
				res.CardId.should.be.above( 0 );
				testCard.Id = res.CardId;
				done();
			} );
		} );

		it( "should add multiple cards without error", function( done ) {
			should.exist( boardIdentifiers );
			var lane = _.find( boardIdentifiers.Lanes, {
				"LaneClassType": 0,
				"Index": 0
			} );
			var now = new Date();
			var externalCardId = now.getTime();

			var card1 = _.clone( testCard );
			card1.Id = 0;
			card1.Title = "AddCards Card 1 " + externalCardId;
			card1.ExternalCardId = externalCardId;
			card1.LaneId = lane.Id;
			externalCardId++;

			var card2 = _.clone( testCard );
			card2.Id = 0;
			card2.Title = "AddCards Card 2 " + externalCardId;
			card2.ExternalCardId = externalCardId;
			card2.LaneId = lane.Id;

			client.addCards( board.Id, [ card1, card2 ], function( err, res ) {
				res.length.should.equal( 2 );
				res[ 0 ].Title.should.startWith( "AddCards" );
				done();
			} );
		} );

		it( "should return the test card by ID", function( done ) {
			should.exist( board );
			client.getCard( board.Id, testCard.Id, function( err, res ) {
				var card = res;
				card.Id.should.equal( testCard.Id );
				done();
			} );
		} );

		it( "should return the test card by external ID", function( done ) {
			should.exist( testCard );
			testCard.Id.should.be.above( 0 );
			client.getCardByExternalId( board.Id, testCard.ExternalCardId, function( err, res ) {
				// console.log(res);
				should.not.exist( err );
				should.exist( res );
				// getCardByExternalId returns an array
				res.length.should.equal( 1 );
				var card = res[ 0 ];
				card.Id.should.equal( testCard.Id );
				done();
			} );
		} );

		it( "moveCard() should move card to 2nd active lane", function( done ) {
			testCard.Id.should.be.above( 0 );
			// Find first active lane
			var lane = _.find( boardIdentifiers.Lanes, {
				"LaneClassType": 0,
				"Index": 1
			} );
			var position = 0;
			client.moveCard( board.Id, testCard.Id, lane.Id, position, "Moving card for testing...", function( err, res ) {
				res.ReplyCode.should.equal( 202 );
				done();
			} );
		} );

		it( "moveCardByExternalId() should move card back to 1st active lane", function( done ) {
			testCard.Id.should.be.above( 0 );
			var lane = _.find( boardIdentifiers.Lanes, {
				"LaneClassType": 0,
				"Index": 0
			} );
			var position = 0;
			client.moveCardByExternalId( board.Id, testCard.ExternalCardId, lane.Id, position, "Moving card for testing...", function( err, res ) {
				res.ReplyCode.should.equal( 202 );
				done();
			} );
		} );

		it.skip( "should move card to another board", function( done ) {
			testCard.Id.should.be.above( 0 );
			// Find a destination board
			var otherBoards = _.remove( boards, function( b ) {
				return b.Id !== board.Id;
			} );
			var destinationBoard = otherBoards[ 0 ];
			destinationBoard.Id.should.not.equal( board.Id );

			client.moveCardToBoard( testCard.Id, destinationBoard.Id, function( err, res ) {
				res.ReplyCode.should.equal( 202 );

				// Move it back
				client.moveCardToBoard( testCard.Id, board.Id, function( err, res ) {
					done();
				} );
			} );
		} );

		it( "updateCard() should update a card without error", function( done ) {
			testCard.Id.should.be.above( 0 );
			testCard.Title = "Updated test card " + testCard.ExternalCardId;
			client.updateCard( board.Id, testCard, function( err, res ) {
				res.ReplyCode.should.equal( 202 );
				done();
			} );
		} );

		it( "updateCardFields() should update a card without error", function( done ) {
			testCard.Id.should.be.above( 0 );
			testCard.Title = "Test Card Update 2 " + testCard.ExternalCardId;
			var updateFields = {
				CardId: testCard.Id,
				Title: "Test Card update 2 " + testCard.ExternalCardId,
				Tags: "test"
			};
			client.updateCardFields( updateFields, function( err, res ) {
				res.ReplyCode.should.equal( 202 );
				done();
			} );
		} );

		it( "updateCards() should update multiple cards without error", function( done ) {
			should.exist( board );
			// Get the latest version of the test board
			client.getBoard( board.Id, function( err, res ) {
				var b = res;
				var lane = _.find( b.Lanes, {
					"Index": 0
				} );
				// console.log(b);
				// Filter out cards that do no start with "AddCards"
				var cards = _.remove( lane.Cards, function( card ) {
					return card.Title && card.Title.indexOf( "AddCards" ) === 0;
				} );
				// console.log(cards);
				cards.forEach( function( card ) {
					card.Tags = "updateCards";
					card.Priority = 2;
				} );
				client.updateCards( b.Id, cards, function( err, res ) {
					// console.log(res);
					should.not.exist( err );
					should.exist( res );
					res.should.have.property( "UpdatedCardsCount" );
					res.UpdatedCardsCount.should.be.above( 0 );
					done();
				} );
			} );
		} );

		it( "addComment() should add a comment without error", function( done ) {
			testCard.Id.should.be.above( 0 );
			client.addComment( board.Id, testCard.Id, user.Id, "Adding a test comment.", function( err, res ) {
				res.ReplyCode.should.equal( 202 );
				done();
			} );
		} );

		it( "addCommentByExternalId() should add a comment without error", function( done ) {
			testCard.Id.should.be.above( 0 );
			client.addCommentByExternalId( board.Id, testCard.ExternalCardId, user.Id, "Adding a test comment by external id.", function( err, res ) {
				res.ReplyCode.should.equal( 202 );
				done();
			} );
		} );

		it( "should get comments without error", function( done ) {
			testCard.Id.should.be.above( 0 );
			client.getComments( board.Id, testCard.Id, function( err, res ) {
				res.length.should.equal( 2 );
				res[ 0 ].Text.indexOf( "Adding a test comment" ).should.equal( 0 );
				done();
			} );
		} );

		it( "should get card history without error", function( done ) {
			testCard.Id.should.be.above( 0 );
			client.getCardHistory( board.Id, testCard.Id, function( err, res ) {
				res.length.should.be.above( 0 );
				done();
			} );
		} );

	} );

	describe( "Card Attachments API", function() {

		before( function() {
			fs.writeFile( "./test/testfile.txt", "test file" );
		} );

		after( function() {
			fs.unlink( "./test/testfile.txt" );
			fs.unlink( "./test/download.txt" );
		} );

		it( "should add attachment without error", function( done ) {
			testCard.Id.should.be.above( 0 );
			var file = fs.createReadStream( "./test/testfile.txt" );
			client.addAttachment( board.Id, testCard.Id, "Test Attachment", file, function( err, res ) {
				should.not.exist( err );
				should.exist( res );
				res.should.have.property( "ReplyCode" );
				res.ReplyCode.should.equal( 202 );
				// console.log( res );
				done();
			} );
		} );

		it( "should get attachments without error", function( done ) {
			testCard.Id.should.be.above( 0 );
			client.getAttachments( board.Id, testCard.Id, function( err, res ) {
				should.not.exist( err );
				should.exist( res );
				// console.log(res);
				res.should.be.instanceOf( Array );
				res.length.should.be.above( 0 );
				res[ 0 ].should.have.property( "FileName" );
				res[ 0 ].should.have.property( "Description" );
				attachment = res[ 0 ];
				done();
			} );
		} );

		it( "should get attachment by ID without error", function( done ) {
			testCard.Id.should.be.above( 0 );
			should.exist( attachment );
			attachment.should.have.property( "Id" );
			client.getAttachment( board.Id, testCard.Id, attachment.Id, function( err, res ) {
				should.not.exist( err );
				should.exist( res );
				// console.log(res);
				res.should.have.property( "Id" );
				res.should.have.property( "FileName" );
				res.should.have.property( "Description" );
				done();
			} );
		} );

		it( "should get attachment count without error", function( done ) {
			testCard.Id.should.be.above( 0 );
			client.getAttachmentCount( board.Id, testCard.Id, function( err, res ) {
				should.not.exist( err );
				should.exist( res );
				res.should.be.above( 0 );
				// console.log(res);
				done();
			} );
		} );

		it( "should download attachment without error", function( done ) {
			should.exist( attachment );
			attachment.should.have.property( "Id" );
			var fileName = "./test/download.txt";
			client.downloadAttachment( board.Id, attachment.Id, fileName, function( err, res ) {
				should.not.exist( err );
				should.exist( res );
				fs.readFile( fileName, "utf8", function( err, text ) {
					should.not.exist( err );
					should.exist( text );
					text.should.equal( "test file" );
					done();
				} );
			} );
		} );

		it( "should delete attachment without error", function( done ) {
			should.exist( attachment );
			attachment.should.have.property( "Id" );
			client.deleteAttachment( board.Id, testCard.Id, attachment.Id, function( err, res ) {
				should.not.exist( err );
				should.exist( res );
				// console.log(res);
				res.should.have.property( "ReplyCode" );
				res.ReplyCode.should.equal( 203 );
				done();
			} );
		} );

	} );

	describe( "Task Board/Card API", function() {
		it( "addTask() should add a task to a card taskboard", function( done ) {
			testCard.Id.should.be.above( 0 );
			taskCard = _.clone( testCard );
			taskCard.Id = 0;
			taskCard.Title = "Task Card 1";
			taskCard.LaneId = 0;
			taskCard.Index = 0;
			taskCard.ExternalCardId = "";

			client.addTask( board.Id, testCard.Id, taskCard, function( err, res ) {
				res.CardId.should.be.above( 0 );
				done();
			} );
		} );

		it( "getTaskboard() should get the card taskboard", function( done ) {
			testCard.Id.should.be.above( 0 );
			client.getTaskboard( board.Id, testCard.Id, function( err, res ) {
				taskBoard = res;
				taskBoard.Id.should.be.above( 0 );
				taskBoard.Lanes.length.should.equal( 3 );
				taskCard = taskBoard.Lanes[ 0 ].Cards[ 0 ];
				// console.log(taskBoard);
				done();
			} );
		} );

		it( "updateTask() should update a task on a card taskboard", function( done ) {
			testCard.Id.should.be.above( 0 );
			taskCard.Title = "Updated task 1";

			client.updateTask( board.Id, testCard.Id, taskCard, function( err, res ) {
				res.ReplyCode.should.equal( 202 );
				done();
			} );
		} );

		it( "moveTask() should move a task on a card taskboard", function( done ) {
			testCard.Id.should.be.above( 0 );
			var lane = _.find( taskBoard.Lanes, {
				Index: 1
			} );
			var position = 0;
			client.moveTask( board.Id, testCard.Id, taskCard.Id, lane.Id, position, function( err, res ) {
				res.ReplyCode.should.equal( 202 );
				done();
			} );
		} );

		it( "getTaskBoardUpdates() should get the latest taskboard", function( done ) {
			testCard.Id.should.be.above( 0 );
			client.getTaskBoardUpdates( board.Id, testCard.Id, 0, function( err, res ) {
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

		it( "deleteTask() should delete a task on a card taskboard", function( done ) {
			testCard.Id.should.be.above( 0 );
			client.deleteTask( board.Id, testCard.Id, taskCard.Id, function( err, res ) {
				res.ReplyCode.should.equal( 203 );
				done();
			} );
		} );

	} );

	describe( "Search API", function() {
		it( "searchCards() should get cards without error", function( done ) {
			var searchOptions = {
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
			client.searchCards( board.Id, searchOptions, function( err, res ) {
				res.Results.length.should.be.above( 2 );
				res.TotalResults.should.be.above( 2 );
				done();
			} );
		} );
	} );

	describe( "Board Updates API", function() {
		it( "getNewCards() should get cards without error", function( done ) {
			client.getNewCards( board.Id, function( err, res ) {
				res.length.should.be.above( 0 );
				res[ 0 ].TypeName.should.equal( "Task" );
				done();
			} );
		} );

		it( "getNewerIfExists() should return a newer board", function( done ) {
			client.getNewerIfExists( board.Id, board.Version, function( err, res ) {
				res.Version.should.be.above( board.Version );
				done();
			} );
		} );

		it( "getBoardHistorySince() should return newer cards", function( done ) {
			client.getBoardHistorySince( board.Id, board.Version, function( err, res ) {
				should.not.exist( err );
				should.exist( res );
				res.should.be.instanceOf( Array );
				res.length.should.be.above( 0 );
				res[ 0 ].should.have.property( "CardId" );
				res[ 0 ].should.have.property( "EventType" );
				done();
			} );
		} );

		it( "getBoardUpdates() should return all recent updates", function( done ) {
			client.getBoardUpdates( board.Id, board.Version, function( err, res ) {
				res.HasUpdates.should.be.true;
				res.AffectedLanes.length.should.be.above( 0 );
				res.Events.length.should.be.above( 0 );
				done();
			} );
		} );
	} );

	describe( "Delete Card API", function() {
		it( "should delete test card without error", function( done ) {
			testCard.Id.should.be.above( 0 );
			client.deleteCard( board.Id, testCard.Id, function( err, res ) {
				res.ReplyCode.should.equal( 203 );
				done();
			} );
		} );

		it( "should delete multiple cards without error", function( done ) {
			// Get the latest version of the test board
			client.getBoard( board.Id, function( err, res ) {
				var b = res;
				var lane = _.find( b.Lanes, {
					"Index": 0
				} );

				// Filter out cards that do no start with "AddCards"
				var cards = _.remove( lane.Cards, function( card ) {
					return card.Title.indexOf( "AddCards" ) === 0;
				} );
				var cardIds = _.pluck( cards, "Id" );
				client.deleteCards( board.Id, cardIds, function( err, res ) {
					res.ReplyCode.should.equal( 203 );
					done();
				} );
			} );
		} );
	} );

	describe( "Errors", function() {
		var scope;
		before( function() {
			var url = accountName === "kanban-cibuild" ?
				"http://kanban-cibuild.localkanban.com" :
				"https://" + accountName + ".leankit.com";

			scope = nock( url )
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
		after( function() {
			nock.cleanAll();
		} );

		it( "should invoke callback with error arg when API replies with 200 OK + ReplyCode not 2xx", function( done ) {
			client.getBoards( function( err, res ) {
				should.exist( err );
				should.not.exist( res );
				err.statusCode.should.equal( 503 );
				done();
			} );
		} );
	} );
	describe( "Client", function() {
		it( "should let you bypass user/pass in favor of headers", function( done ) {
			var credentials = new Buffer( email + ":" + pwd ).toString( "base64" );
			var opts = {
				headers: {
					authorization: "Basic " + credentials
				}
			};

			var client = LeanKitClient.createClient( accountName, opts );

			client.getBoards( function( err, res ) {
				should.not.exist( err );
				should.exist( res );
				boards = res;
				boards.length.should.be.above( 0 );
				done();
			} );
		} );
	} );
} );
