var path = require( "path" );
var _ = require( "lodash" );
var request = require( "request-json" );

var parseReplyData = function( error, response, callback, cacheCallback ) {
	if ( error ) {
		return callback( error, response );
	} else if ( response && response.ReplyCode && response.ReplyCode > 399 ) {
		error = new Error( response.ReplyText );
		error.statusCode = response.ReplyCode;
		return callback( error );
	} else if ( response && response.ReplyCode !== 200 && response.ReplyCode !== 201 ) {
		return callback( error, response );
	} else if ( response.ReplyData && response.ReplyData.length > 0 ) {
		if ( cacheCallback ) {
			cacheCallback( response.ReplyData[ 0 ] );
		}
		return callback( error, response.ReplyData[ 0 ] );
	} else {
		return callback( error, response );
	}
};

var parseBody = function( body ) {
	var err, parsed;
	if ( typeof body === "string" && body !== "" ) {
		try {
			parsed = JSON.parse( body );
		} catch (_error) {
			err = _error;
			parsed = body;
		}
	} else {
		parsed = body;
	}
	return parsed;
};

var defaultWipOverrideReason = "WIP Override performed by external system";

exports.createClient = function( account, email, password, options ) {
	if ( arguments.length === 2 ) {
		options = arguments[ 1 ];
		email = null;
		password = null;
	}
	return new exports.LeanKitClient( account, email, password, options );
};

exports.LeanKitClient = (function() {
	var boardIdentifiers;

	boardIdentifiers = {};

	function LeanKitClient( account, email, password, options ) {
		options = options || {};

		var url = "https://" + account + ".leankit.com/kanban/api/";
		if ( account === "kanban-cibuild" ) {
			url = "http://kanban-cibuild.localkanban.com/kanban/api/";
		}
		this.client = request.createClient( url, options );
		if ( password ) {
			this.client.setBasicAuth( email, password );
		}
	}

	LeanKitClient.prototype.getBoards = function( callback ) {
		return this.client.get( "boards", function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.getNewBoards = function( callback ) {
		return this.client.get( "ListNewBoards", function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.getBoard = function( boardId, callback ) {
		return this.client.get( "boards/" + boardId, function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.getBoardByName = function( boardToFind, callback ) {
		var $this;
		$this = this;
		return this.getBoards( function( err, boards ) {
			var board;
			if ( boards && boards.length > 0 ) {
				board = _.find( boards, {
					"Title": boardToFind
				} );
				if ( board && board.Id > 0 ) {
					return $this.getBoard( board.Id, callback );
				} else {
					return callback( err, board );
				}
			} else {
				return callback( err, null );
			}
		} );
	};

	LeanKitClient.prototype.getBoardIdentifiers = function( boardId, callback ) {
		if ( boardId in boardIdentifiers ) {
			callback( null, boardIdentifiers[ boardId ] );
		}
		return this.client.get( "board/" + boardId + "/GetBoardIdentifiers", function( err, res, body ) {
			return parseReplyData( err, body, callback, function( data ) {
				return boardIdentifiers[ boardId ] = data;
			} );
		} );
	};

	LeanKitClient.prototype.getBoardBacklogLanes = function( boardId, callback ) {
		return this.client.get( "board/" + boardId + "/backlog", function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.getBoardArchiveLanes = function( boardId, callback ) {
		return this.client.get( "board/" + boardId + "/archive", function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.getBoardArchiveCards = function( boardId, callback ) {
		return this.client.get( "board/" + boardId + "/archivecards", function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.getNewerIfExists = function( boardId, version, callback ) {
		return this.client.get( "board/" + boardId + "/boardversion/" + version + "/getnewerifexists", function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.getBoardHistorySince = function( boardId, version, callback ) {
		return this.client.get( "board/" + boardId + "/boardversion/" + version + "/getboardhistorysince", function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.getBoardUpdates = function( boardId, version, callback ) {
		return this.client.get( "board/" + boardId + "/boardversion/" + version + "/checkforupdates", function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.getCard = function( boardId, cardId, callback ) {
		return this.client.get( "board/" + boardId + "/getcard/" + cardId, function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.getCardByExternalId = function( boardId, externalCardId, callback ) {
		return this.client.get( "board/" + boardId + "/getcardbyexternalid/" + encodeURIComponent( externalCardId ), function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.addCard = function( boardId, laneId, position, card, callback ) {
		return this.addCardWithWipOverride( boardId, laneId, position, defaultWipOverrideReason, card, callback );
	};

	LeanKitClient.prototype.addCardWithWipOverride = function( boardId, laneId, position, wipOverrideReason, card, callback ) {
		card.UserWipOverrideComment = wipOverrideReason;
		return this.client.post( "board/" + boardId + "/AddCardWithWipOverride/Lane/" + laneId + "/Position/" + position, card, function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.addCards = function( boardId, cards, callback ) {
		return this.addCardsWithWipOverride( boardId, cards, defaultWipOverrideReason, callback );
	};

	LeanKitClient.prototype.addCardsWithWipOverride = function( boardId, cards, wipOverrideReason, callback ) {
		return this.client.post( "board/" + boardId + "/AddCards?wipOverrideComment=" + encodeURIComponent( wipOverrideReason ), cards, function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.moveCard = function( boardId, cardId, toLaneId, position, wipOverrideReason, callback ) {
		return this.client.post( "board/" + boardId + "/movecardwithwipoverride/" + cardId + "/lane/" + toLaneId + "/position/" + position, {
			comment: wipOverrideReason
		}, function( err, res, body ) {
				return parseReplyData( err, body, callback );
			} );
	};

	LeanKitClient.prototype.moveCardByExternalId = function( boardId, externalCardId, toLaneId, position, wipOverrideReason, callback ) {
		return this.client.post( "board/" + boardId + "/movecardbyexternalid/" + encodeURIComponent( externalCardId ) + "/lane/" + toLaneId + "/position/" + position, {
			comment: wipOverrideReason
		}, function( err, res, body ) {
				return parseReplyData( err, body, callback );
			} );
	};

	LeanKitClient.prototype.moveCardToBoard = function( cardId, destinationBoardId, callback ) {
		return this.client.post( "card/movecardtoanotherboard/" + cardId + "/" + destinationBoardId, null, function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.updateCard = function( boardId, card, callback ) {
		card.UserWipOverrideComment = defaultWipOverrideReason;
		return this.client.post( "board/" + boardId + "/UpdateCardWithWipOverride", card, function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.updateCardFields = function( updateFields, callback ) {
		return this.client.post( "card/update", updateFields, function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.updateCards = function( boardId, cards, callback ) {
		return this.client.post( "board/" + boardId + "/updatecards?wipoverridecomment=" + encodeURIComponent( defaultWipOverrideReason ), cards, function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.getComments = function( boardId, cardId, callback ) {
		return this.client.get( "card/getcomments/" + boardId + "/" + cardId, function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.addComment = function( boardId, cardId, userId, comment, callback ) {
		var data;
		data = {
			PostedById: userId,
			Text: comment
		};
		return this.client.post( "card/savecomment/" + boardId + "/" + cardId, data, function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.addCommentByExternalId = function( boardId, externalCardId, userId, comment, callback ) {
		var data;
		data = {
			PostedById: userId,
			Text: comment
		};
		return this.client.post( "card/savecommentbyexternalid/" + boardId + "/" + encodeURIComponent( externalCardId ), data, function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.getCardHistory = function( boardId, cardId, callback ) {
		return this.client.get( "card/history/" + boardId + "/" + cardId, function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.searchCards = function( boardId, options, callback ) {
		return this.client.post( "board/" + boardId + "/searchcards", options, function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.getNewCards = function( boardId, callback ) {
		return this.client.get( "board/" + boardId + "/listnewcards", function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.deleteCard = function( boardId, cardId, callback ) {
		return this.client.post( "board/" + boardId + "/deletecard/" + cardId, null, function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.deleteCards = function( boardId, cardIds, callback ) {
		return this.client.post( "board/" + boardId + "/deletecards", cardIds, function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.getTaskboard = function( boardId, cardId, callback ) {
		return this.client.get( "v1/board/" + boardId + "/card/" + cardId + "/taskboard", function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.addTask = function( boardId, cardId, taskCard, callback ) {
		taskCard.UserWipOverrideComment = defaultWipOverrideReason;
		return this.client.post( "v1/board/" + boardId + "/card/" + cardId + "/tasks/lane/" + taskCard.LaneId + "/position/" + taskCard.Index, taskCard, function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.updateTask = function( boardId, cardId, taskCard, callback ) {
		taskCard.UserWipOverrideComment = defaultWipOverrideReason;
		return this.client.post( "v1/board/" + boardId + "/update/card/" + cardId + "/tasks/" + taskCard.Id, taskCard, function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.deleteTask = function( boardId, cardId, taskId, callback ) {
		return this.client.post( "v1/board/" + boardId + "/delete/card/" + cardId + "/tasks/" + taskId, null, function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.getTaskBoardUpdates = function( boardId, cardId, version, callback ) {
		return this.client.get( "v1/board/" + boardId + "/card/" + cardId + "/tasks/boardversion/" + version, function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.moveTask = function( boardId, cardId, taskId, toLaneId, position, callback ) {
		return this.client.post( "v1/board/" + boardId + "/move/card/" + cardId + "/tasks/" + taskId + "/lane/" + toLaneId + "/position/" + position, null, function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.getAttachmentCount = function( boardId, cardId, callback ) {
		return this.client.get( "card/GetAttachmentsCount/" + boardId + "/" + cardId, function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.getAttachments = function( boardId, cardId, callback ) {
		return this.client.get( "card/GetAttachments/" + boardId + "/" + cardId, function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.getAttachment = function( boardId, cardId, attachmentId, callback ) {
		return this.client.get( "card/GetAttachments/" + boardId + "/" + cardId + "/" + attachmentId, function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.downloadAttachment = function( boardId, attachmentId, filePath, callback ) {
		return this.client.saveFile( "card/DownloadAttachment/" + boardId + "/" + attachmentId, filePath, function( err, res, body ) {
			return callback( err, body );
		} );
	};

	LeanKitClient.prototype.deleteAttachment = function( boardId, cardId, attachmentId, callback ) {
		return this.client.post( "card/DeleteAttachment/" + boardId + "/" + cardId + "/" + attachmentId, null, function( err, res, body ) {
			return parseReplyData( err, body, callback );
		} );
	};

	LeanKitClient.prototype.addAttachment = function( boardId, cardId, description, file, callback ) {
		var attachmentData, fileName;
		if ( typeof file === "string" ) {
			fileName = path.basename( file );
		} else {
			fileName = path.basename( file.path );
		}
		attachmentData = {
			Id: 0,
			Description: description,
			FileName: fileName
		};
		return this.client.sendFile( "card/SaveAttachment/" + boardId + "/" + cardId, file, attachmentData, function( err, res, body ) {
			var parsed;
			parsed = parseBody( body );
			return parseReplyData( err, parsed, callback );
		} );
	};

	return LeanKitClient;

})();
