"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
/* eslint-disable max-lines */
var path = require("path");
var request = require("request");
var when = require("when");
var fs = require("fs");
var jetpack = require("fs-jetpack");
var STATUS_200 = 200;
var STATUS_201 = 201;

var buildUrl = function buildUrl(acct) {
	var url = "";
	if (acct.indexOf("http://") !== 0 && acct.indexOf("https://") !== 0) {
		url = "https://" + acct;
		// Assume leankit.com if no domain is specified
		if (acct.indexOf(".") === -1) {
			url += ".leankit.com";
		}
	} else {
		url = acct;
	}
	if (url.indexOf("/", acct.length - 1) !== 0) {
		url += "/";
	}
	return url;
	// return url + "kanban/api/";
};

var parseReplyData = function parseReplyData(error, response, body, callback, cacheCallback) {
	if (error) {
		if (error instanceof Error) {
			return callback(error, body);
		}
		var err = new Error(error.toString());
		err.name = "clientRequestError";
		return callback(err, body);
	} else if (response.statusCode !== STATUS_200) {
		var _err = new Error(body);
		_err.name = "clientRequestError";
		_err.replyCode = response.statusCode;
		return callback(_err, body);
	} else if (body && body.ReplyCode && body.ReplyCode > 399) {
		// eslint-disable-line no-magic-numbers
		var _err2 = new Error(body.ReplyText || "apiError");
		_err2.name = "apiError";
		_err2.httpStatusCode = body.ReplyCode;
		_err2.replyCode = body.ReplyCode;
		_err2.replyText = body.ReplyText;
		_err2.replyData = body.ReplyData;
		return callback(_err2);
	} else if (body && body.ReplyCode && body.ReplyCode !== STATUS_200 && body.ReplyCode !== STATUS_201) {
		return callback(null, body);
	} else if (body.ReplyData && body.ReplyData.length > 0) {
		if (typeof cacheCallback === "function") {
			cacheCallback(body.ReplyData[0]);
		}
		return callback(null, body.ReplyData[0]);
	}
	return callback(null, body);
};

var parseBody = function parseBody(body) {
	var err = void 0,
	    parsed = void 0;
	if (typeof body === "string" && body !== "") {
		try {
			parsed = JSON.parse(body);
		} catch (_error) {
			err = _error;
			parsed = body;
		}
	} else {
		parsed = body;
	}
	return { err: err, body: parsed };
};

var checkPath = function checkPath(urlPath) {
	return urlPath.startsWith("api/") ? urlPath : "kanban/api/" + urlPath;
};

var LeanKitClient = function LeanKitClient() {
	// eslint-disable-line max-statements
	var account = arguments.length <= 0 ? undefined : arguments[0];
	var email = arguments.length > 2 ? arguments.length <= 1 ? undefined : arguments[1] : null; // eslint-disable-line no-magic-numbers
	var password = arguments.length > 2 ? arguments.length <= 2 ? undefined : arguments[2] : null; // eslint-disable-line no-magic-numbers
	var options = void 0;
	switch (arguments.length) {
		case 4:
			// eslint-disable-line no-magic-numbers
			options = arguments.length <= 3 ? undefined : arguments[3]; // eslint-disable-line no-magic-numbers
			break;
		case 2:
			// eslint-disable-line no-magic-numbers
			options = arguments.length <= 1 ? undefined : arguments[1];
			break;
		default:
			options = {};
	}
	options = options || {};

	var boardIdentifiers = {};

	var defaultWipOverrideReason = "WIP Override performed by external system";
	var url = buildUrl(account);
	if (!options.baseUrl && !options.uri && !options.url) {
		options.baseUrl = url;
	}

	if (options.proxy && (options.proxy.indexOf("localhost") > -1 || options.proxy.indexOf("127.0.0.1") > -1)) {
		process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
	}

	if (!options.headers) {
		options.headers = {};
	}

	if (!options.headers["User-Agent"]) {
		var version = void 0;
		if (jetpack.exists(__dirname + "/package.json")) {
			var pkg = jetpack.read(__dirname + "/package.json", "json");
			version = pkg.version;
		} else {
			version = "1.0.0";
		}
		options.headers["User-Agent"] = "leankit-node-client/" + version;
	}

	if (password) {
		var cred = email + ":" + password;
		var basicAuth = new Buffer(cred).toString("base64");
		options.headers.authorization = "Basic " + basicAuth;
	}

	options.json = true;

	if (!options.headers.accept) {
		options.headers.accept = "application/json";
	}

	if (!options.headers["Content-Type"]) {
		options.headers["Content-Type"] = "application/json";
	}

	var client = request.defaults(options);

	var clientGet = function clientGet(urlPath, callback) {
		var p = when.promise(function (resolve, reject) {
			urlPath = checkPath(urlPath);
			client.get(urlPath, function (err, res, body) {
				if (err) {
					if (err instanceof Error) {
						reject(err);
					}
					var error = new Error("httpGetError");
					error.details = err;
					reject(error);
				} else {
					parseReplyData(err, res, body, function (parseErr, parsed) {
						if (parseErr) {
							reject(parseErr);
						} else {
							resolve(parsed);
						}
					});
				}
			});
		});

		if (typeof callback === "function") {
			p.then(function (res) {
				callback(null, res);
			}).catch(function (err) {
				callback(err);
			});
		}
		return p;
	};

	var clientPost = function clientPost(urlPath, data, callback) {
		var p = when.promise(function (resolve, reject) {
			urlPath = checkPath(urlPath);
			client.post(urlPath, { body: data }, function (err, res, body) {
				if (err) {
					reject(err);
				} else {
					parseReplyData(err, res, body, function (parseErr, parsed) {
						if (!parseErr) {
							resolve(parsed);
						} else {
							reject(parseErr);
						}
					});
				}
			});
		});
		if (typeof callback === "function") {
			p.then(function (res) {
				callback(null, res);
			}).catch(function (err) {
				callback(err, null);
			});
		}
		return p;
	};

	var clientSaveFile = function clientSaveFile(urlPath, file, callback) {
		var p = when.promise(function (resolve, reject) {
			var f = typeof file === "string" ? fs.createWriteStream(file) : file;
			urlPath = checkPath(urlPath);
			var res = client.get(urlPath);
			res.pipe(f);
			res.on("end", function () {
				resolve(f);
			});
		});
		if (typeof callback === "function") {
			p.then(function (res) {
				callback(null, res);
			}).catch(function (err) {
				callback(err);
			});
		}
		return p;
	};

	var sendFile = function sendFile(urlPath, file, attachmentData, callback) {
		if (typeof file === "string") {
			attachmentData.file = fs.createReadStream(file);
		} else {
			attachmentData.file = file;
		}
		client.post({ url: urlPath, formData: attachmentData }, function (err, res, body) {
			callback(err, res, body);
		});
	};

	var clientSendFile = function clientSendFile(urlPath, file, attachmentData, callback) {
		var p = when.promise(function (resolve, reject) {
			urlPath = checkPath(urlPath);
			sendFile(urlPath, file, attachmentData, function (err, res, body) {
				if (err) {
					reject(err);
				} else {
					var parsed = parseBody(body);
					if (parsed.err) {
						reject(parsed.err);
					} else {
						resolve(parsed.body);
					}
				}
			});
		});
		if (typeof callback === "function") {
			p.then(function (res) {
				callback(null, res);
			}).catch(function (err) {
				callback(err);
			});
		}
		return p;
	};

	var getBoards = function getBoards(callback) {
		return clientGet("boards", callback);
	};

	var getNewBoards = function getNewBoards(callback) {
		return clientGet("ListNewBoards", callback);
	};

	var getBoard = function getBoard(boardId, callback) {
		return clientGet("boards/" + boardId, callback);
	};

	var getBoardByName = function getBoardByName(boardToFind, callback) {
		var p = when.promise(function (resolve, reject) {
			getBoards().then(function (boards) {
				if (boards && boards.length > 0) {
					var board = boards.find(function (b) {
						return b.Title === boardToFind;
					});
					if (board && board.Id > 0) {
						getBoard(board.Id).then(function (b) {
							resolve(b);
						}, function (err) {
							reject(err);
						});
					} else {
						reject("[" + boardToFind + "] not found");
					}
				} else {
					reject("No boards returned");
				}
			}, function (err) {
				reject(err);
			});
		});
		if (typeof callback === "function") {
			p.then(function (board) {
				callback(null, board);
			}, function (err) {
				callback(err);
			});
		}
		return p;
	};

	var getBoardIdentifiers = function getBoardIdentifiers(boardId, callback) {
		var p = when.promise(function (resolve, reject) {
			if (boardId in boardIdentifiers) {
				resolve(boardIdentifiers[boardId]);
			} else {
				clientGet("board/" + boardId + "/GetBoardIdentifiers").then(function (data) {
					boardIdentifiers[boardId] = data;
					resolve(data);
				}, function (err) {
					reject(err);
				});
			}
		});
		if (typeof callback === "function") {
			p.then(function (data) {
				callback(null, data);
			}, function (err) {
				callback(err);
			});
		}
		return p;
	};

	var getBoardBacklogLanes = function getBoardBacklogLanes(boardId, callback) {
		return clientGet("board/" + boardId + "/backlog", callback);
	};

	var getBoardArchiveLanes = function getBoardArchiveLanes(boardId, callback) {
		return clientGet("board/" + boardId + "/archive", callback);
	};

	var getBoardArchiveCards = function getBoardArchiveCards(boardId, callback) {
		return clientGet("board/" + boardId + "/archivecards", callback);
	};

	var getNewerIfExists = function getNewerIfExists(boardId, version, callback) {
		return clientGet("board/" + boardId + "/boardversion/" + version + "/getnewerifexists", callback);
	};

	var getBoardHistorySince = function getBoardHistorySince(boardId, version, callback) {
		return clientGet("board/" + boardId + "/boardversion/" + version + "/getboardhistorysince", callback);
	};

	var getBoardUpdates = function getBoardUpdates(boardId, version, callback) {
		return clientGet("board/" + boardId + "/boardversion/" + version + "/checkforupdates", callback);
	};

	var getCard = function getCard(boardId, cardId, callback) {
		return clientGet("board/" + boardId + "/getcard/" + cardId, callback);
	};

	var getCardByExternalId = function getCardByExternalId(boardId, externalCardId, callback) {
		return clientGet("board/" + boardId + "/getcardbyexternalid/" + encodeURIComponent(externalCardId), callback);
	};

	var addCardWithWipOverride = function addCardWithWipOverride(boardId, laneId, position, wipOverrideReason, card, callback) {
		// eslint-disable-line max-params
		card.UserWipOverrideComment = wipOverrideReason;
		return clientPost("board/" + boardId + "/AddCardWithWipOverride/Lane/" + laneId + "/Position/" + position, card, callback);
	};

	var addCard = function addCard(boardId, laneId, position, card, callback) {
		return addCardWithWipOverride(boardId, laneId, position, defaultWipOverrideReason, card, callback);
	};

	var addCardsWithWipOverride = function addCardsWithWipOverride(boardId, cards, wipOverrideReason, callback) {
		return clientPost("board/" + boardId + "/AddCards?wipOverrideComment=" + encodeURIComponent(wipOverrideReason), cards, callback);
	};

	var addCards = function addCards(boardId, cards, callback) {
		return addCardsWithWipOverride(boardId, cards, defaultWipOverrideReason, callback);
	};

	var moveCard = function moveCard(boardId, cardId, toLaneId, position, wipOverrideReason, callback) {
		// eslint-disable-line max-params
		return clientPost("board/" + boardId + "/movecardwithwipoverride/" + cardId + "/lane/" + toLaneId + "/position/" + position, {
			comment: wipOverrideReason
		}, callback);
	};

	var moveCardByExternalId = function moveCardByExternalId(boardId, externalCardId, toLaneId, position, wipOverrideReason, callback) {
		// eslint-disable-line max-params
		return clientPost("board/" + boardId + "/movecardbyexternalid/" + encodeURIComponent(externalCardId) + "/lane/" + toLaneId + "/position/" + position, {
			comment: wipOverrideReason
		}, callback);
	};

	var moveCardToBoard = function moveCardToBoard(cardId, destinationBoardId, callback) {
		return clientPost("card/movecardtoanotherboard/" + cardId + "/" + destinationBoardId, null, callback);
	};

	var updateCard = function updateCard(boardId, card, callback) {
		card.UserWipOverrideComment = defaultWipOverrideReason;
		return clientPost("board/" + boardId + "/UpdateCardWithWipOverride", card, callback);
	};

	var updateCardFields = function updateCardFields(updateFields, callback) {
		return clientPost("card/update", updateFields, callback);
	};

	var updateCards = function updateCards(boardId, cards, callback) {
		return clientPost("board/" + boardId + "/updatecards?wipoverridecomment=" + encodeURIComponent(defaultWipOverrideReason), cards, callback);
	};

	var getComments = function getComments(boardId, cardId, callback) {
		return clientGet("card/getcomments/" + boardId + "/" + cardId, callback);
	};

	var addComment = function addComment(boardId, cardId, userId, comment, callback) {
		var data = {
			PostedById: userId,
			Text: comment
		};
		return clientPost("card/savecomment/" + boardId + "/" + cardId, data, callback);
	};

	var addCommentByExternalId = function addCommentByExternalId(boardId, externalCardId, userId, comment, callback) {
		var data = {
			PostedById: userId,
			Text: comment
		};
		return clientPost("card/savecommentbyexternalid/" + boardId + "/" + encodeURIComponent(externalCardId), data, callback);
	};

	var getCardHistory = function getCardHistory(boardId, cardId, callback) {
		return clientGet("card/history/" + boardId + "/" + cardId, callback);
	};

	var searchCards = function searchCards(boardId, searchOptions, callback) {
		return clientPost("board/" + boardId + "/searchcards", searchOptions, callback);
	};

	var getNewCards = function getNewCards(boardId, callback) {
		return clientGet("board/" + boardId + "/listnewcards", callback);
	};

	var deleteCard = function deleteCard(boardId, cardId, callback) {
		return clientPost("board/" + boardId + "/deletecard/" + cardId, null, callback);
	};

	var deleteCards = function deleteCards(boardId, cardIds, callback) {
		return clientPost("board/" + boardId + "/deletecards", cardIds, callback);
	};

	var getTaskboard = function getTaskboard(boardId, cardId, callback) {
		return clientGet("v1/board/" + boardId + "/card/" + cardId + "/taskboard", callback);
	};

	var addTask = function addTask(boardId, cardId, taskCard, callback) {
		taskCard.UserWipOverrideComment = defaultWipOverrideReason;
		return clientPost("v1/board/" + boardId + "/card/" + cardId + "/tasks/lane/" + taskCard.LaneId + "/position/" + taskCard.Index, taskCard, callback);
	};

	var updateTask = function updateTask(boardId, cardId, taskCard, callback) {
		taskCard.UserWipOverrideComment = defaultWipOverrideReason;
		return clientPost("v1/board/" + boardId + "/update/card/" + cardId + "/tasks/" + taskCard.Id, taskCard, callback);
	};

	var deleteTask = function deleteTask(boardId, cardId, taskId, callback) {
		return clientPost("v1/board/" + boardId + "/delete/card/" + cardId + "/tasks/" + taskId, null, callback);
	};

	var getTaskBoardUpdates = function getTaskBoardUpdates(boardId, cardId, version, callback) {
		return clientGet("v1/board/" + boardId + "/card/" + cardId + "/tasks/boardversion/" + version, callback);
	};

	var moveTask = function moveTask(boardId, cardId, taskId, toLaneId, position, callback) {
		// eslint-disable-line max-params
		return clientPost("v1/board/" + boardId + "/move/card/" + cardId + "/tasks/" + taskId + "/lane/" + toLaneId + "/position/" + position, null, callback);
	};

	var getAttachmentCount = function getAttachmentCount(boardId, cardId, callback) {
		return clientGet("card/GetAttachmentsCount/" + boardId + "/" + cardId, callback);
	};

	var getAttachments = function getAttachments(boardId, cardId, callback) {
		return clientGet("card/GetAttachments/" + boardId + "/" + cardId, callback);
	};

	var getAttachment = function getAttachment(boardId, cardId, attachmentId, callback) {
		return clientGet("card/GetAttachments/" + boardId + "/" + cardId + "/" + attachmentId, callback);
	};

	var downloadAttachment = function downloadAttachment(boardId, attachmentId, file, callback) {
		return clientSaveFile("card/DownloadAttachment/" + boardId + "/" + attachmentId, file, callback);
	};

	var deleteAttachment = function deleteAttachment(boardId, cardId, attachmentId, callback) {
		return clientPost("card/DeleteAttachment/" + boardId + "/" + cardId + "/" + attachmentId, null, callback);
	};

	var addAttachment = function addAttachment(boardId, cardId, description, file, callback) {
		var fileName = void 0;
		if (typeof file === "string") {
			fileName = path.basename(file);
		} else {
			fileName = path.basename(file.path);
		}
		var attachmentData = {
			Id: 0,
			Description: description,
			FileName: fileName
		};
		return clientSendFile("card/SaveAttachment/" + boardId + "/" + cardId, file, attachmentData, callback);
	};

	var getCurrentUserProfile = function getCurrentUserProfile() {
		var boardId = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

		return clientGet("api/user/getcurrentusersettings/" + boardId);
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
		getCurrentUserProfile: getCurrentUserProfile,
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

exports.default = LeanKitClient;

module.exports = LeanKitClient;
module.exports = exports["default"];