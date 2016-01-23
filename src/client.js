const path = require( "path" );
const request = require( "request" );
const when = require( "when" );
const fs = require( "fs" );
const jetpack = require( "fs-jetpack" );

const LeanKitClient = ( account, email, password, options ) => {
	if ( arguments.length === 2 ) {
		options = arguments[ 1 ];
		email = null;
		password = null;
	}

	const buildUrl = ( account ) => {
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

	let boardIdentifiers = {};

	options = options || {};

	const defaultWipOverrideReason = "WIP Override performed by external system";
	const url = buildUrl( account );
	if ( !options.baseUrl && !options.uri && !options.url ) {
		options.baseUrl = url;
	}

	if ( options.proxy && ( options.proxy.indexOf( "localhost" ) > -1 || options.proxy.indexOf( "127.0.0.1" ) > -1 ) ) {
		process.env[ "NODE_TLS_REJECT_UNAUTHORIZED" ] = "0";
	}

	if ( !options.headers ) {
		options.headers = {};
	}

	if ( !options.headers["User-Agent"] ) {
		let version;
		if ( jetpack.exists( __dirname + "/package.json" ) ) {
			let pkg = jetpack.read( __dirname + "/package.json", "json" );
			version = pkg.version;
		} else {
			version = "1.0.0";
		}
		options.headers["User-Agent"] = `leankit-node-client/${version}`;
	}

	if ( password ) {
		let cred = `${email}:${password}`;
		let basicAuth = new Buffer( cred ).toString( "base64" );
		options.headers.authorization = `Basic ${basicAuth}`;
	}

	options.json = true;

	if ( !options.headers.accept ) {
		options.headers.accept = "application/json";
	}

	if ( !options.headers["Content-Type"] ) {
		options.headers["Content-Type"] = "application/json";
	}

	const client = request.defaults( options );

	const parseReplyData = ( error, response, callback, cacheCallback ) => {
		if ( error ) {
			if ( error instanceof Error ) {
				return callback( error, response );
			} else {
				let err = new Error( error.toString() );
				err.name = "clientRequestError";
				return callback( err, response );
			}
		} else if ( response && response.ReplyCode && response.ReplyCode > 399 ) {
			let err = new Error( response.ReplyText || "apiError" );
			err.name = "apiError";
			err.httpStatusCode = response.ReplyCode;
			err.replyCode = response.ReplyCode;
			err.replyText = response.ReplyText;
			err.replyData = response.ReplyData;
			return callback( err );
		} else if ( response && response.ReplyCode !== 200 && response.ReplyCode !== 201 ) {
			return callback( null, response );
		} else if ( response.ReplyData && response.ReplyData.length > 0 ) {
			if ( typeof cacheCallback === "function" ) {
				cacheCallback( response.ReplyData[0] );
			}
			return callback( null, response.ReplyData[0] );
		} else {
			return callback( null, response );
		}
	};

	const parseBody = ( body ) => {
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

	const clientGet = ( path, callback ) => {
		let p = when.promise( ( resolve, reject ) => {
			client.get( path, ( err, res, body ) => {
				if ( err ) {
					if ( err instanceof Error ) {
						reject( err );
					} else {
						let error = new Error( "httpGetError" );
						error.details = err;
						reject( error );
					}
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
			} ).catch( ( err ) => {
				return callback( err );
			} );
		} else {
			return p;
		}
	};

	const clientPost = ( path, data, callback ) => {
		let p = when.promise( ( resolve, reject ) => {
			client.post( path, { body: data }, ( err, res, body ) => {
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
			} )
			.catch( ( err ) => {
				return callback( err, null );
			} );
		} else {
			return p;
		}
	};

	const clientSaveFile = ( path, file, callback ) => {
		let p = when.promise( ( resolve, reject ) => {
			let f = ( typeof file === "string" ) ? fs.createWriteStream( file ) : file;
			let res = client.get( path );
			res.pipe( f );
			res.on( "end", () => {
				resolve( f );
			} );
		} );
		if ( typeof callback === "function" ) {
			p.then( ( res ) => {
				return callback( null, res );
			} ).catch( ( err ) => {
				return callback( err );
			} );
		} else {
			return p;
		}
	};

	const sendFile = ( path, file, attachmentData, callback ) => {
		if ( typeof file === "string" ) {
			attachmentData.file = fs.createReadStream( file );
		} else {
			attachmentData.file = file;
		}
		client.post( { url: path, formData: attachmentData }, ( err, res, body ) => {
			callback( err, res, body );
		} );
	};

	const clientSendFile = ( path, file, attachmentData, callback ) => {
		let p = when.promise( ( resolve, reject ) => {
			sendFile( path, file, attachmentData, ( err, res, body ) => {
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
			} ).catch( ( err ) => {
				return callback( err );
			} );
		} else {
			return p;
		}
	};

	const getBoards = ( callback ) => {
		return clientGet( "boards", callback );
	};

	const getNewBoards = ( callback ) => {
		return clientGet( "ListNewBoards", callback );
	};

	const getBoard = ( boardId, callback ) => {
		return clientGet( `boards/${boardId}`, callback );
	};

	const getBoardByName = ( boardToFind, callback ) => {
		let p = when.promise( ( resolve, reject ) => {
			getBoards().then( ( boards ) => {
				if ( boards && boards.length > 0 ) {
					let board = boards.find( ( b ) => {
						return b.Title === boardToFind;
					} );
					if ( board && board.Id > 0 ) {
						getBoard( board.Id ).then( ( b ) => {
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

	const getBoardIdentifiers = ( boardId, callback ) => {
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

	const getBoardBacklogLanes = ( boardId, callback ) => {
		return clientGet( `board/${boardId}/backlog`, callback );
	};

	const getBoardArchiveLanes = ( boardId, callback ) => {
		return clientGet( `board/${boardId}/archive`, callback );
	};

	const getBoardArchiveCards = ( boardId, callback ) => {
		return clientGet( `board/${boardId}/archivecards`, callback );
	};

	const getNewerIfExists = ( boardId, version, callback ) => {
		return clientGet( `board/${boardId}/boardversion/${version}/getnewerifexists`, callback );
	};

	const getBoardHistorySince = ( boardId, version, callback ) => {
		return clientGet( `board/${boardId}/boardversion/${version}/getboardhistorysince`, callback );
	};

	const getBoardUpdates = ( boardId, version, callback ) => {
		return clientGet( `board/${boardId}/boardversion/${version}/checkforupdates`, callback );
	};

	const getCard = ( boardId, cardId, callback ) => {
		return clientGet( `board/${boardId}/getcard/${cardId}`, callback );
	};

	const getCardByExternalId = ( boardId, externalCardId, callback ) => {
		return clientGet( `board/${boardId}/getcardbyexternalid/${encodeURIComponent( externalCardId )}`, callback );
	};

	const addCard = ( boardId, laneId, position, card, callback ) => {
		return addCardWithWipOverride( boardId, laneId, position, defaultWipOverrideReason, card, callback );
	};

	const addCardWithWipOverride = ( boardId, laneId, position, wipOverrideReason, card, callback ) => {
		card.UserWipOverrideComment = wipOverrideReason;
		return clientPost( `board/${boardId}/AddCardWithWipOverride/Lane/${laneId}/Position/${position}`, card, callback );
	};

	const addCards = ( boardId, cards, callback ) => {
		return addCardsWithWipOverride( boardId, cards, defaultWipOverrideReason, callback );
	};

	const addCardsWithWipOverride = ( boardId, cards, wipOverrideReason, callback ) => {
		return clientPost( `board/${boardId}/AddCards?wipOverrideComment=${encodeURIComponent( wipOverrideReason )}`, cards, callback );
	};

	const moveCard = ( boardId, cardId, toLaneId, position, wipOverrideReason, callback ) => {
		return clientPost( `board/${boardId}/movecardwithwipoverride/${cardId}/lane/${toLaneId}/position/${position}`, {
			comment: wipOverrideReason
		}, callback );
	};

	const moveCardByExternalId = ( boardId, externalCardId, toLaneId, position, wipOverrideReason, callback ) => {
		return clientPost( `board/${boardId}/movecardbyexternalid/${encodeURIComponent( externalCardId )}/lane/${toLaneId}/position/${position}`, {
			comment: wipOverrideReason
		}, callback );
	};

	const moveCardToBoard = ( cardId, destinationBoardId, callback ) => {
		return clientPost( `card/movecardtoanotherboard/${cardId}/${destinationBoardId}`, null, callback );
	};

	const updateCard = ( boardId, card, callback ) => {
		card.UserWipOverrideComment = defaultWipOverrideReason;
		return clientPost( `board/${boardId}/UpdateCardWithWipOverride`, card, callback );
	};

	const updateCardFields = ( updateFields, callback ) => {
		return clientPost( "card/update", updateFields, callback );
	};

	const updateCards = ( boardId, cards, callback ) => {
		return clientPost( `board/${boardId}/updatecards?wipoverridecomment=${encodeURIComponent( defaultWipOverrideReason )}`, cards, callback );
	};

	const getComments = ( boardId, cardId, callback ) => {
		return clientGet( `card/getcomments/${boardId}/${cardId}`, callback );
	};

	const addComment = ( boardId, cardId, userId, comment, callback ) => {
		let data;
		data = {
			PostedById: userId,
			Text: comment
		};
		return clientPost( `card/savecomment/${boardId}/${cardId}`, data, callback );
	};

	const addCommentByExternalId = ( boardId, externalCardId, userId, comment, callback ) => {
		let data;
		data = {
			PostedById: userId,
			Text: comment
		};
		return clientPost( `card/savecommentbyexternalid/${boardId}/${encodeURIComponent( externalCardId )}`, data, callback );
	};

	const getCardHistory = ( boardId, cardId, callback ) => {
		return clientGet( `card/history/${boardId}/${cardId}`, callback );
	};

	const searchCards = ( boardId, options, callback ) => {
		return clientPost( `board/${boardId}/searchcards`, options, callback );
	};

	const getNewCards = ( boardId, callback ) => {
		return clientGet( `board/${boardId}/listnewcards`, callback );
	};

	const deleteCard = ( boardId, cardId, callback ) => {
		return clientPost( `board/${boardId}/deletecard/${cardId}`, null, callback );
	};

	const deleteCards = ( boardId, cardIds, callback ) => {
		return clientPost( `board/${boardId}/deletecards`, cardIds, callback );
	};

	const getTaskboard = ( boardId, cardId, callback ) => {
		return clientGet( `v1/board/${boardId}/card/${cardId}/taskboard`, callback );
	};

	const addTask = ( boardId, cardId, taskCard, callback ) => {
		taskCard.UserWipOverrideComment = defaultWipOverrideReason;
		return clientPost( `v1/board/${boardId}/card/${cardId}/tasks/lane/${taskCard.LaneId}/position/${taskCard.Index}`, taskCard, callback );
	};

	const updateTask = ( boardId, cardId, taskCard, callback ) => {
		taskCard.UserWipOverrideComment = defaultWipOverrideReason;
		return clientPost( `v1/board/${boardId}/update/card/${cardId}/tasks/${taskCard.Id}`, taskCard, callback );
	};

	const deleteTask = ( boardId, cardId, taskId, callback ) => {
		return clientPost( `v1/board/${boardId}/delete/card/${cardId}/tasks/${taskId}`, null, callback );
	};

	const getTaskBoardUpdates = ( boardId, cardId, version, callback ) => {
		return clientGet( `v1/board/${boardId}/card/${cardId}/tasks/boardversion/${version}`, callback );
	};

	const moveTask = ( boardId, cardId, taskId, toLaneId, position, callback ) => {
		return clientPost( `v1/board/${boardId}/move/card/${cardId}/tasks/${taskId}/lane/${toLaneId}/position/${position}`, null, callback );
	};

	const getAttachmentCount = ( boardId, cardId, callback ) => {
		return clientGet( `card/GetAttachmentsCount/${boardId}/${cardId}`, callback );
	};

	const getAttachments = ( boardId, cardId, callback ) => {
		return clientGet( `card/GetAttachments/${boardId}/${cardId}`, callback );
	};

	const getAttachment = ( boardId, cardId, attachmentId, callback ) => {
		return clientGet( `card/GetAttachments/${boardId}/${cardId}/${attachmentId}`, callback );
	};

	const downloadAttachment = ( boardId, attachmentId, file, callback ) => {
		return clientSaveFile( `card/DownloadAttachment/${boardId}/${attachmentId}`, file, callback );
	};

	const deleteAttachment = ( boardId, cardId, attachmentId, callback ) => {
		return clientPost( `card/DeleteAttachment/${boardId}/${cardId}/${attachmentId}`, null, callback );
	};

	const addAttachment = ( boardId, cardId, description, file, callback ) => {
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
		_options: options
	};
};

export default LeanKitClient;
