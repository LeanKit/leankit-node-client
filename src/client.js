const path = require( "path" );
const request = require( "request-json" );
const when = require( "when" );

let LeanKitClient = function( account, email, password, options ) {
	if ( arguments.length === 2 ) {
		options = arguments[ 1 ];
		email = null;
		password = null;
	}
	let boardIdentifiers = {};

	options = options || {};

	let parseReplyData = function( error, response, callback, cacheCallback ) {
		if ( error ) {
			return callback( error, response );
		} else if ( response && response.ReplyCode && response.ReplyCode > 399 ) {
			return callback( { replyText: response.ReplyText, replyCode: response.ReplyCode }, response );
		} else if ( response && response.ReplyCode !== 200 && response.ReplyCode !== 201 ) {
			return callback( error, response );
		} else if ( response.ReplyData && response.ReplyData.length > 0 ) {
			if ( typeof cacheCallback === "function" ) {
				cacheCallback( response.ReplyData[0] );
			}
			return callback( error, response.ReplyData[0] );
		} else {
			return callback( error, response );
		}
	};

	let parseBody = function( body ) {
		let err, parsed;
		if ( typeof body === "string" && body !== "" ) {
			try {
				parsed = JSON.parse( body );
			} catch ( _error ) {
				err = _error;
				parsed = body;
			}
		} else {
			parsed = body;
		}
		return { err: err, body: parsed };
	};

	let buildUrl = function( account ) {
		let url = "";
		if ( account.indexOf( "http://" ) !== 0 && account.indexOf( "https://" ) !== 0 ) {
			url = "https://" + account;
			// Assume leankit.com if no domain is specified
			if ( account.indexOf( "." ) === -1 ) {
				url += ".leankit.com";
			}
		} else {
			url = account;
		}
		if ( url.indexOf( "/", account.length - 1 ) !== 0 ) {
			url += "/";
		}
		return url + "kanban/api/";
	};

	let clientGet = function( path, callback ) {
		let p = when.promise( ( resolve, reject ) => {
			client.get( path, ( err, res, body ) => {
				if ( err ) {
					reject( err );
				} else {
					parseReplyData( err, body, ( parseErr, parsed ) => {
						if ( !parseErr ) {
							resolve( parsed );
						} else {
							reject( parseErr );
						}
					} );
				}
			} );
		} );

		if ( typeof callback === "function" ) {
			p.then( ( res ) => {
				return callback( null, res );
			}, ( err ) => {
				return callback( err );
			} );
		} else {
			return p;
		}
	};

	let clientPost = function( path, data, callback ) {
		let p = when.promise( ( resolve, reject ) => {
			client.post( path, data, ( err, res, body ) => {
				if ( err ) {
					reject( err );
				} else {
					parseReplyData( err, body, ( parseErr, parsed ) => {
						if ( !parseErr ) {
							resolve( parsed );
						} else {
							reject( parseErr );
						}
					} );
				}
			} );
		} );
		if ( typeof callback === "function" ) {
			p.then( ( res ) => {
				return callback( null, res );
			}, ( err ) => {
				return callback( err, null );
			} ).catch( ( err ) => {
				return callback( err, null );
			} );
		} else {
			return p;
		}
	};

	let clientSaveFile = function( path, filePath, callback ) {
		let p = when.promise( ( resolve, reject ) => {
			client.saveFile( path, filePath, ( err, res, body ) => {
				if ( err ) {
					reject( err );
				} else {
					resolve( body );
				}
			} );
		} );
		if ( typeof callback === "function" ) {
			p.then( ( res ) => {
				return callback( null, res );
			}, ( err ) => {
				return callback( err );
			} );
		} else {
			return p;
		}
	};

	let clientSendFile = function( path, file, attachmentData, callback ) {
		let p = when.promise( ( resolve, reject ) => {
			client.sendFile( path, file, attachmentData, ( err, res, body ) => {
				if ( err ) {
					reject( err );
				} else {
					let parsed = parseBody( body );
					if ( parsed.err ) {
						reject( parsed.err );
					} else {
						resolve( parsed.body );
					}
				}
			} );
		} );
		if ( typeof callback === "function" ) {
			p.then( ( res ) => {
				return callback( null, res );
			}, ( err ) => {
				return callback( err );
			} );
		} else {
			return p;
		}
	};

	let getBoards = function( callback ) {
		return clientGet( "boards", callback );
	};

	let getNewBoards = function( callback ) {
		return clientGet( "ListNewBoards", callback );
	};

	let getBoard = function( boardId, callback ) {
		return clientGet( `boards/${boardId}`, callback );
	};

	let getBoardByName = function( boardToFind, callback ) {
		let p = when.promise( ( resolve, reject ) => {
			this.getBoards().then( ( boards ) => {
				if ( boards && boards.length > 0 ) {
					let board = boards.find( ( b ) => {
						return b.Title === boardToFind;
					} );
					if ( board && board.Id > 0 ) {
						this.getBoard( board.Id ).then( ( b ) => {
							resolve( b );
						}, ( err ) => {
							reject( err );
						} );
					} else {
						reject( `[${boardToFind}] not found` );
					}
				} else {
					reject( "No boards returned" );
				}
			}, ( err ) => {
				reject( err );
			} );
		} );
		if ( typeof callback === "function" ) {
			p.then( ( board ) => {
				return callback( null, board );
			}, ( err ) => {
				return callback( err );
			} );
		} else {
			return p;
		}
	};

	let getBoardIdentifiers = function( boardId, callback ) {
		let p = when.promise( ( resolve, reject ) => {
			if ( boardId in boardIdentifiers ) {
				resolve( boardIdentifiers[boardId] );
			} else {
				clientGet( `board/${boardId}/GetBoardIdentifiers` ).then( ( data ) => {
					boardIdentifiers[boardId] = data;
					resolve( data );
				}, ( err ) => {
					reject( err );
				} );
			}
		} );
		if ( typeof callback === "function" ) {
			p.then( ( data ) => {
				return callback( null, data );
			}, ( err ) => {
				return callback( err );
			} );
		} else {
			return p;
		}
	};

	let getBoardBacklogLanes = function( boardId, callback ) {
		return clientGet( `board/${boardId}/backlog`, callback );
	};

	let getBoardArchiveLanes = function( boardId, callback ) {
		return clientGet( `board/${boardId}/archive`, callback );
	};

	let getBoardArchiveCards = function( boardId, callback ) {
		return clientGet( `board/${boardId}/archivecards`, callback );
	};

	let getNewerIfExists = function( boardId, version, callback ) {
		return clientGet( `board/${boardId}/boardversion/${version}/getnewerifexists`, callback );
	};

	let getBoardHistorySince = function( boardId, version, callback ) {
		return clientGet( `board/${boardId}/boardversion/${version}/getboardhistorysince`, callback );
	};

	let getBoardUpdates = function( boardId, version, callback ) {
		return clientGet( `board/${boardId}/boardversion/${version}/checkforupdates`, callback );
	};

	let getCard = function( boardId, cardId, callback ) {
		return clientGet( `board/${boardId}/getcard/${cardId}`, callback );
	};

	let getCardByExternalId = function( boardId, externalCardId, callback ) {
		return clientGet( `board/${boardId}/getcardbyexternalid/${encodeURIComponent( externalCardId )}`, callback );
	};

	let addCard = function( boardId, laneId, position, card, callback ) {
		return addCardWithWipOverride( boardId, laneId, position, defaultWipOverrideReason, card, callback );
	};

	let addCardWithWipOverride = function( boardId, laneId, position, wipOverrideReason, card, callback ) {
		card.UserWipOverrideComment = wipOverrideReason;
		return clientPost( `board/${boardId}/AddCardWithWipOverride/Lane/${laneId}/Position/${position}`, card, callback );
	};

	let addCards = function( boardId, cards, callback ) {
		return this.addCardsWithWipOverride( boardId, cards, defaultWipOverrideReason, callback );
	};

	let addCardsWithWipOverride = function( boardId, cards, wipOverrideReason, callback ) {
		return clientPost( `board/${boardId}/AddCards?wipOverrideComment=${encodeURIComponent( wipOverrideReason )}`, cards, callback );
	};

	let moveCard = function( boardId, cardId, toLaneId, position, wipOverrideReason, callback ) {
		return clientPost( `board/${boardId}/movecardwithwipoverride/${cardId}/lane/${toLaneId}/position/${position}`, {
			comment: wipOverrideReason
		}, callback );
	};

	let moveCardByExternalId = function( boardId, externalCardId, toLaneId, position, wipOverrideReason, callback ) {
		return clientPost( `board/${boardId}/movecardbyexternalid/${encodeURIComponent( externalCardId )}/lane/${toLaneId}/position/${position}`, {
			comment: wipOverrideReason
		}, callback );
	};

	let moveCardToBoard = function( cardId, destinationBoardId, callback ) {
		return clientPost( `card/movecardtoanotherboard/${cardId}/${destinationBoardId}`, null, callback );
	};

	let updateCard = function( boardId, card, callback ) {
		card.UserWipOverrideComment = defaultWipOverrideReason;
		return clientPost( `board/${boardId}/UpdateCardWithWipOverride`, card, callback );
	};

	let updateCardFields = function( updateFields, callback ) {
		return clientPost( "card/update", updateFields, callback );
	};

	let updateCards = function( boardId, cards, callback ) {
		return clientPost( `board/${boardId}/updatecards?wipoverridecomment=${encodeURIComponent( defaultWipOverrideReason )}`, cards, callback );
	};

	let getComments = function( boardId, cardId, callback ) {
		return clientGet( `card/getcomments/${boardId}/${cardId}`, callback );
	};

	let addComment = function( boardId, cardId, userId, comment, callback ) {
		let data;
		data = {
			PostedById: userId,
			Text: comment
		};
		return clientPost( `card/savecomment/${boardId}/${cardId}`, data, callback );
	};

	let addCommentByExternalId = function( boardId, externalCardId, userId, comment, callback ) {
		let data;
		data = {
			PostedById: userId,
			Text: comment
		};
		return clientPost( `card/savecommentbyexternalid/${boardId}/${encodeURIComponent( externalCardId )}`, data, callback );
	};

	let getCardHistory = function( boardId, cardId, callback ) {
		return clientGet( `card/history/${boardId}/${cardId}`, callback );
	};

	let searchCards = function( boardId, options, callback ) {
		return clientPost( `board/${boardId}/searchcards`, options, callback );
	};

	let getNewCards = function( boardId, callback ) {
		return clientGet( `board/${boardId}/listnewcards`, callback );
	};

	let deleteCard = function( boardId, cardId, callback ) {
		return clientPost( `board/${boardId}/deletecard/${cardId}`, null, callback );
	};

	let deleteCards = function( boardId, cardIds, callback ) {
		return clientPost( `board/${boardId}/deletecards`, cardIds, callback );
	};

	let getTaskboard = function( boardId, cardId, callback ) {
		return clientGet( `v1/board/${boardId}/card/${cardId}/taskboard`, callback );
	};

	let addTask = function( boardId, cardId, taskCard, callback ) {
		taskCard.UserWipOverrideComment = defaultWipOverrideReason;
		return clientPost( `v1/board/${boardId}/card/${cardId}/tasks/lane/${taskCard.LaneId}/position/${taskCard.Index}`, taskCard, callback );
	};

	let updateTask = function( boardId, cardId, taskCard, callback ) {
		taskCard.UserWipOverrideComment = defaultWipOverrideReason;
		return clientPost( `v1/board/${boardId}/update/card/${cardId}/tasks/${taskCard.Id}`, taskCard, callback );
	};

	let deleteTask = function( boardId, cardId, taskId, callback ) {
		return clientPost( `v1/board/${boardId}/delete/card/${cardId}/tasks/${taskId}`, null, callback );
	};

	let getTaskBoardUpdates = function( boardId, cardId, version, callback ) {
		return clientGet( `v1/board/${boardId}/card/${cardId}/tasks/boardversion/${version}`, callback );
	};

	let moveTask = function( boardId, cardId, taskId, toLaneId, position, callback ) {
		return clientPost( `v1/board/${boardId}/move/card/${cardId}/tasks/${taskId}/lane/${toLaneId}/position/${position}`, null, callback );
	};

	let getAttachmentCount = function( boardId, cardId, callback ) {
		return clientGet( `card/GetAttachmentsCount/${boardId}/${cardId}`, callback );
	};

	let getAttachments = function( boardId, cardId, callback ) {
		return clientGet( `card/GetAttachments/${boardId}/${cardId}`, callback );
	};

	let getAttachment = function( boardId, cardId, attachmentId, callback ) {
		return clientGet( `card/GetAttachments/${boardId}/${cardId}/${attachmentId}`, callback );
	};

	let downloadAttachment = function( boardId, attachmentId, filePath, callback ) {
		return clientSaveFile( `card/DownloadAttachment/${boardId}/${attachmentId}`, filePath, callback );
	};

	let deleteAttachment = function( boardId, cardId, attachmentId, callback ) {
		return clientPost( `card/DeleteAttachment/${boardId}/${cardId}/${attachmentId}`, null, callback );
	};

	let addAttachment = function( boardId, cardId, description, file, callback ) {
		let attachmentData, fileName;
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
		return clientSendFile( `card/SaveAttachment/${boardId}/${cardId}`, file, attachmentData, callback );
	};

	let defaultWipOverrideReason = "WIP Override performed by external system";
	const url = buildUrl( account );
	let client = request.createClient( url, options );
	if ( password ) {
		client.setBasicAuth( email, password );
	}

	return {
		addAttachment: addAttachment,
		addCard: addCard,
		addCards: addCards,
		addCardsWithWipOverride: addCardsWithWipOverride,
		addCardWithWipOverride: addCardWithWipOverride,
		addComment: addComment,
		addCommentByExternalId: addCommentByExternalId,
		addTask: addTask,
		deleteAttachment: deleteAttachment,
		deleteCard: deleteCard,
		deleteCards: deleteCards,
		deleteTask: deleteTask,
		downloadAttachment: downloadAttachment,
		getAttachment: getAttachment,
		getAttachmentCount: getAttachmentCount,
		getAttachments: getAttachments,
		getBoard: getBoard,
		getBoardArchiveCards: getBoardArchiveCards,
		getBoardArchiveLanes: getBoardArchiveLanes,
		getBoardBacklogLanes: getBoardBacklogLanes,
		getBoardByName: getBoardByName,
		getBoardHistorySince: getBoardHistorySince,
		getBoardIdentifiers: getBoardIdentifiers,
		getBoards: getBoards,
		getBoardUpdates: getBoardUpdates,
		getCard: getCard,
		getCardByExternalId: getCardByExternalId,
		getCardHistory: getCardHistory,
		getComments: getComments,
		getNewBoards: getNewBoards,
		getNewCards: getNewCards,
		getNewerIfExists: getNewerIfExists,
		getTaskboard: getTaskboard,
		getTaskBoardUpdates: getTaskBoardUpdates,
		moveCard: moveCard,
		moveCardByExternalId: moveCardByExternalId,
		moveCardToBoard: moveCardToBoard,
		moveTask: moveTask,
		searchCards: searchCards,
		updateCard: updateCard,
		updateCardFields: updateCardFields,
		updateCards: updateCards,
		updateTask: updateTask,
		_client: client
	};
};

export default LeanKitClient;
