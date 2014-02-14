var _ = require('lodash');
var assert = require('assert');
var should = require('should');
var LeanKitClient = require('../leankit-client');
var accountName = process.env.LEANKIT_ACCOUNT || 'your-account-name', 
	email = process.env.LEANKIT_EMAIL || 'your@email.com', 
	pwd = process.env.LEANKIT_PASSWORD || 'p@ssw0rd';

describe('LeanKitClient', function(){
	this.timeout(10000);

	var client = {},
		boards = [],
		boardToFind = 'API Test Board',
		boardIdentifiers = {},
		board = {},
		user = {},
		testCard = {
			Title: 'Mocha Test Card',
			Description: '',
			TypeId: 0,
			Priority: 1,
			Size: 0,
			IsBlocked: false,
			BlockReason: '',
			DueDate: '',
			ExternalSystemName: '',
			ExternalSystemUrl: '',
			Tags: '',
			ClassOfServiceId: null,
			ExternalCardId: '',
			AssignedUserIds: [],
			UserWipOverrideComment: 'Because...'
		},
		taskBoard = {},
		taskCard = {};

	before(function (done) {
		client = LeanKitClient.newClient(accountName, email, pwd);
		done();
	});

	describe('getBoards()', function(){
		it('should return a list of boards', function(done) {
			client.getBoards(function(err, res) {
				boards = res;
				boards.length.should.be.above(0);
				done();
			});			
		});
	});

	describe('getNewBoards()', function(){
		it('should return a list of boards', function(done) {
			client.getNewBoards(function(err, res) {
				res.length.should.be.above(0);
				done();
			});		
		});
	});

	describe('getBoard()', function() {
		it('should return a valid board', function(done) {
			client.getBoard(boards[0].Id, function(err, res) {
				res.Id.should.equal(boards[0].Id);
				done();
			})
		});
	});

	describe('getBoardByName()', function() {
		it('should return a valid board', function(done) {
			client.getBoardByName(boardToFind, function(err, res) {
				board = res;
				board.Title.should.equal(boardToFind);
				board.BoardUsers.length.should.be.above(0);
				user = board.BoardUsers[0];
				done();
			});
		});
	});

	describe('getBoardIdentifiers()', function() {
		it('should return a valid set of board identifiers', function(done) {
			client.getBoardIdentifiers(board.Id, function(err, res) {
				res.Lanes.length.should.be.above(0);
				res.CardTypes.length.should.be.above(0);
				boardIdentifiers = res;
				done();
			});
		});
	});

	describe('getBoardBacklogLanes()', function() {
		it('should return a valid set of backlog lanes', function(done) {
			client.getBoardBacklogLanes(board.Id, function(err, res){
				res.length.should.be.above(0);
				res[0].Width.should.be.above(0);
				done();
			});
		});
	});

	describe('getBoardArchiveLanes()', function() {
		it('should return a valid set of backlog lanes', function(done) {
			client.getBoardArchiveLanes(board.Id, function(err, res){
				res.length.should.be.above(0);
				res[0].Lane.Width.should.be.above(0);
				done();
			});
		});
	});

	describe('getBoardArchiveCards()', function() {
		it('should return 0 or more cards', function(done) {
			client.getBoardArchiveCards(board.Id, function(err, res){
				res.length.should.be.above(0);
				done();
			});
		});
	});

	describe('addCard()', function() {
		it('should add a card without error', function(done) {

			var lane = _.find(boardIdentifiers.Lanes, { 'Name': 'ToDo' });
			lane.Id.should.be.above(0);
			
			var cardType = _.find(boardIdentifiers.CardTypes, { 'Name': 'Task'});
			cardType.Id.should.be.above(0);

			testCard.TypeId = cardType.Id;
			var now = new Date();
			testCard.Title = "Mocha test card " + now.getTime();
			testCard.ExternalCardId = now.getTime();

			client.addCard(board.Id, lane.Id, 0, testCard, function(err, res) {
			 	res.CardId.should.be.above(0);
			 	testCard.Id = res.CardId;
			 	done();
			});
		});
	});


	describe('addCards()', function() {
		it('should add multiple cards without error', function(done) {

			var lane = _.find(boardIdentifiers.Lanes, { 'Name': 'ToDo' });
			var cardType = _.find(boardIdentifiers.CardTypes, { 'Name': 'Task'});
			var now = new Date();
			var externalCardId = now.getTime();

			var card1 = _.clone(testCard);
			card1.Id = 0;
			card1.Title = "AddCards Card 1 " + externalCardId;
			card1.ExternalCardId = externalCardId;
			card1.LaneId = lane.Id;
			externalCardId++;

			var card2 = _.clone(testCard);
			card2.Id = 0;
			card2.Title = "AddCards Card 2 " + externalCardId;
			card2.ExternalCardId = externalCardId;
			card2.LaneId = lane.Id;

			client.addCards(board.Id, [card1, card2], function(err, res) {
			 	res.length.should.equal(2);
			 	res[0].Title.should.startWith('AddCards');
			 	done();
			});
		});
	});

	describe('getCard()', function(){
		it('should return the test card', function(done){
			client.getCard(board.Id, testCard.Id, function(err, res) {
				var card = res;
				card.Id.should.equal(testCard.Id);
				done();
			});
		});
	});

	describe('getCardByExternalId()', function(){
		it('should return the test card', function(done){
			client.getCardByExternalId(board.Id, testCard.ExternalCardId, function(err, res) {
				// getCardByExternalId returns an array
				res.length.should.equal(1);
				var card = res[0];
				card.Id.should.equal(testCard.Id);
				done();
			});
		});
	});

	describe('moveCard()', function() {
		it('should move card to Doing lane', function(done) {
			var lane = _.find(boardIdentifiers.Lanes, { 'Name' : 'Doing'});
			var position = 0;
			client.moveCard(board.Id, testCard.Id, lane.Id, position, 'Moving card for testing...', function(err, res) {
				res.ReplyCode.should.equal(202);
				done();
			});
		});
	});

	describe('moveCardByExternalId()', function() {
		it('should move card back to ToDo lane', function(done) {
			var lane = _.find(boardIdentifiers.Lanes, { 'Name' : 'ToDo'});
			var position = 0;
			client.moveCardByExternalId(board.Id, testCard.ExternalCardId, lane.Id, position, 'Moving card for testing...', function(err, res) {
				res.ReplyCode.should.equal(202);
				done();
			});
		});
	});

	describe('moveCardToBoard()', function() {
		it('should move card to another board', function(done){
			// Find a destination board
			var otherBoards = _.remove(boards, function(b) {
				return b.Id !== board.Id;
			});
			var destinationBoard = otherBoards[0];
			destinationBoard.Id.should.not.equal(board.Id);

			client.moveCardToBoard(testCard.Id, destinationBoard.Id, function(err, res){
				res.ReplyCode.should.equal(202);

				// Move it back
				client.moveCardToBoard(testCard.Id, board.Id, function(err, res){
					done();
				});
			});
		});
	});

	describe('updateCard()', function(){
		it('should update a card without error', function(done) {
			testCard.Title = 'Updated test card ' + testCard.ExternalCardId;
			client.updateCard(board.Id, testCard, function(err, res){
				res.ReplyCode.should.equal(202);
				done();
			});
		});
	});

	describe('updateCardFields()', function(){
		it('should update a card without error', function(done) {
			testCard.Title = 'Test Card Update 2 ' + testCard.ExternalCardId;
			var updateFields = { CardId : testCard.Id, Title: 'Test Card update 2 ' + testCard.ExternalCardId, Tags: 'test' };
			client.updateCardFields(updateFields, function(err, res){
				res.ReplyCode.should.equal(202);
				done();
			});
		});
	});

	describe('updateCards()', function(){
		it('should update multiple cards without error', function(done) {
			// Get the latest version of the test board
			client.getBoard(board.Id, function(err, res){
				var b = res;
				var lane = _.find(b.Lanes, {'Title': 'ToDo'});

				// Filter out cards that do no start with 'AddCards'
				var cards = _.remove(lane.Cards, function(card) {
					return card.Title.indexOf('AddCards') === 0;
				});
				cards.forEach(function(card) {
					card.Tags = 'updateCards';
					card.Priority = 2;
				});
				client.updateCards(b.Id, cards, function(err, res) {
					res.UpdatedCardsCount.should.be.above(0);
					done();
				});
			});
		});
	});

	describe('addComment()', function() {
		it('should add a comment without error', function(done){
			client.addComment(board.Id, testCard.Id, user.Id, 'Adding a test comment.', function(err, res){
				res.ReplyCode.should.equal(202);
				done();
			});
		});
	});

	describe('addCommentByExternalId()', function() {
		it('should add a comment without error', function(done){
			client.addCommentByExternalId(board.Id, testCard.ExternalCardId, user.Id, 'Adding a test comment by external id.', function(err, res){
				res.ReplyCode.should.equal(202);
				done();
			});
		});
	});

	describe('getComments()', function() {
		it('should get comments without error', function(done){
			client.getComments(board.Id, testCard.Id, function(err, res){
				res.length.should.equal(2);
				res[0].Text.indexOf('Adding a test comment').should.equal(0);
				done();
			});
		});
	});

	describe('getCardHistory()', function() {
		it('should get card history without error', function(done){
			client.getCardHistory(board.Id, testCard.Id, function(err, res){
				res.length.should.be.above(0);
				done();
			});
		});
	});

	describe('addTask()', function() {
		it('should add a task to a card taskboard', function(done){
			taskCard = _.clone(testCard);
			taskCard.Id = 0;
			taskCard.Title = "Task Card 1";
			taskCard.LaneId = 0;
			taskCard.Index = 0;
			taskCard.ExternalCardId = '';

			client.addTask(board.Id, testCard.Id, taskCard, function(err, res){
				res.CardId.should.be.above(0);
				done();
			});
		});
	});

	describe('getTaskboard()', function() {
		it('should get the card taskboard', function(done){
			client.getTaskboard(board.Id, testCard.Id, function(err, res){
				taskBoard = res;
				taskBoard.Id.should.be.above(0);
				taskBoard.Lanes.length.should.equal(3);
				taskCard = taskBoard.Lanes[0].Cards[0];
				done();
			});
		});
	});

	describe('updateTask()', function() {
		it('should update a task on a card taskboard', function(done){
			taskCard.Title = 'Updated task 1';

			client.updateTask(board.Id, testCard.Id, taskCard, function(err, res){
				res.ReplyCode.should.equal(202);
				done();
			});
		});
	});

	describe('moveTask()', function() {
		it('should move a task on a card taskboard', function(done){
			var lane = _.find(taskBoard.Lanes, { Index : 1 });
			var position = 0;
			client.moveTask(board.Id, testCard.Id, taskCard.Id, lane.Id, position, function(err, res){
				res.ReplyCode.should.equal(202);
				done();
			});
		});
	});

	describe('deleteTask()', function() {
		it('should delete a task on a card taskboard', function(done){
			client.deleteTask(board.Id, testCard.Id, taskCard.Id, function(err, res){
				res.ReplyCode.should.equal(203);
				done();
			});
		});
	});

	describe('getTaskBoardUpdates()', function() {
		it('should get the latest taskboard', function(done){
			client.getTaskBoardUpdates(board.Id, testCard.Id, 0, function(err, res){
				res.HasUpdates.should.be.true;
				res.AffectedLanes.length.should.be.above(0);
				res.Events.length.should.be.above(0);
				res.CurrentBoardVersion.should.be.above(1);
				done();
			});
		});
	});

	describe('searchCards()', function() {
		it('should get cards without error', function(done){
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
			client.searchCards(board.Id, searchOptions, function(err, res){
				res.Results.length.should.be.above(2);
				res.TotalResults.should.be.above(2);
				done();
			});
		});
	});

	describe('getNewCards()', function() {
		it('should get cards without error', function(done){
			client.getNewCards(board.Id, function(err, res){
				res.length.should.be.above(0);
				res[0].TypeName.should.equal('Task');
				done();
			});
		});
	});

	describe('getNewerIfExists()', function() {
		it('should return a newer board', function(done) {
			client.getNewerIfExists(board.Id, board.Version, function(err, res){
				res.Version.should.be.above(board.Version);
				done();
			});
		});
	});

	describe('getBoardHistorySince()', function() {
		it('should return newer cards', function(done) {
			client.getBoardHistorySince(board.Id, board.Version, function(err, res){
				res.length.should.be.above(0);
				res[0].CardId.should.equal(testCard.Id);
				done();
			});
		});
	});

	describe('getBoardUpdates()', function() {
		it('should return all recent updates', function(done) {
			client.getBoardUpdates(board.Id, board.Version, function(err, res){
				res.HasUpdates.should.be.true;
				res.AffectedLanes.length.should.be.above(0);
				res.Events.length.should.be.above(0);
				done();
			});
		});
	});

	describe('deleteCard()', function(){
		it('should delete test card without error', function(done){
			client.deleteCard(board.Id, testCard.Id, function(err, res){
				res.ReplyCode.should.equal(203);
				done();
			});
		});
	});

	describe('deleteCards()', function(){
		it('should delete multiple cards without error', function(done){
			// Get the latest version of the test board
			client.getBoard(board.Id, function(err, res){
				var b = res;
				var lane = _.find(b.Lanes, {'Title': 'ToDo'});

				// Filter out cards that do no start with 'AddCards'
				var cards = _.remove(lane.Cards, function(card) {
					return card.Title.indexOf('AddCards') === 0;
				});
				var cardIds = _.pluck(cards, 'Id');
				client.deleteCards(board.Id, cardIds, function(err, res){
					res.ReplyCode.should.equal(203);
					done();
				});
			});
		});
	});


});


