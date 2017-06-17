"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
/* eslint-disable max-lines */
const path = require("path");
const request = require("request");
const when = require("when");
const fs = require("fs");
const jetpack = require("fs-jetpack");
const STATUS_200 = 200;
const STATUS_201 = 201;

const buildUrl = acct => {
	let url = "";
	if (acct.indexOf("http://") !== 0 && acct.indexOf("https://") !== 0) {
		url = `https://${acct}`;
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

const parseReplyData = (error, response, body, callback, cacheCallback) => {
	if (error) {
		if (error instanceof Error) {
			return callback(error, body);
		}
		const err = new Error(error.toString());
		err.name = "clientRequestError";
		return callback(err, body);
	} else if (response.statusCode !== STATUS_200) {
		const err = new Error(body);
		err.name = "clientRequestError";
		err.replyCode = response.statusCode;
		return callback(err, body);
	} else if (body && body.ReplyCode && body.ReplyCode > 399) {
		// eslint-disable-line no-magic-numbers
		const err = new Error(body.ReplyText || "apiError");
		err.name = "apiError";
		err.httpStatusCode = body.ReplyCode;
		err.replyCode = body.ReplyCode;
		err.replyText = body.ReplyText;
		err.replyData = body.ReplyData;
		return callback(err);
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

const parseBody = body => {
	let err, parsed;
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
	return { err, body: parsed };
};

const checkPath = urlPath => {
	return urlPath.startsWith("api/") ? urlPath : `kanban/api/${urlPath}`;
};

const LeanKitClient = (...args) => {
	// eslint-disable-line max-statements
	const account = args[0];
	const email = args.length > 2 ? args[1] : null; // eslint-disable-line no-magic-numbers
	const password = args.length > 2 ? args[2] : null; // eslint-disable-line no-magic-numbers
	let options;
	switch (args.length) {
		case 4:
			// eslint-disable-line no-magic-numbers
			options = args[3]; // eslint-disable-line no-magic-numbers
			break;
		case 2:
			// eslint-disable-line no-magic-numbers
			options = args[1];
			break;
		default:
			options = {};
	}
	options = options || {};

	const boardIdentifiers = {};

	const defaultWipOverrideReason = "WIP Override performed by external system";
	const url = buildUrl(account);
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
		let version;
		if (jetpack.exists(`${__dirname}/package.json`)) {
			const pkg = jetpack.read(`${__dirname}/package.json`, "json");
			version = pkg.version;
		} else {
			version = "1.0.0";
		}
		options.headers["User-Agent"] = `leankit-node-client/${version}`;
	}

	if (password) {
		const cred = `${email}:${password}`;
		const basicAuth = new Buffer(cred).toString("base64");
		options.headers.authorization = `Basic ${basicAuth}`;
	}

	options.json = true;

	if (!options.headers.accept) {
		options.headers.accept = "application/json";
	}

	if (!options.headers["Content-Type"]) {
		options.headers["Content-Type"] = "application/json";
	}

	const client = request.defaults(options);

	const clientGet = (urlPath, callback) => {
		const p = when.promise((resolve, reject) => {
			urlPath = checkPath(urlPath);
			client.get(urlPath, (err, res, body) => {
				if (err) {
					if (err instanceof Error) {
						reject(err);
					}
					const error = new Error("httpGetError");
					error.details = err;
					reject(error);
				} else {
					parseReplyData(err, res, body, (parseErr, parsed) => {
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
			p.then(res => {
				callback(null, res);
			}).catch(err => {
				callback(err);
			});
		}
		return p;
	};

	const clientPost = (urlPath, data, callback) => {
		const p = when.promise((resolve, reject) => {
			urlPath = checkPath(urlPath);
			client.post(urlPath, { body: data }, (err, res, body) => {
				if (err) {
					reject(err);
				} else {
					parseReplyData(err, res, body, (parseErr, parsed) => {
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
			p.then(res => {
				callback(null, res);
			}).catch(err => {
				callback(err, null);
			});
		}
		return p;
	};

	const clientSaveFile = (urlPath, file, callback) => {
		const p = when.promise((resolve, reject) => {
			const f = typeof file === "string" ? fs.createWriteStream(file) : file;
			urlPath = checkPath(urlPath);
			const res = client.get(urlPath);
			res.pipe(f);
			res.on("end", () => {
				resolve(f);
			});
		});
		if (typeof callback === "function") {
			p.then(res => {
				callback(null, res);
			}).catch(err => {
				callback(err);
			});
		}
		return p;
	};

	const sendFile = (urlPath, file, attachmentData, callback) => {
		if (typeof file === "string") {
			attachmentData.file = fs.createReadStream(file);
		} else {
			attachmentData.file = file;
		}
		client.post({ url: urlPath, formData: attachmentData }, (err, res, body) => {
			callback(err, res, body);
		});
	};

	const clientSendFile = (urlPath, file, attachmentData, callback) => {
		const p = when.promise((resolve, reject) => {
			urlPath = checkPath(urlPath);
			sendFile(urlPath, file, attachmentData, (err, res, body) => {
				if (err) {
					reject(err);
				} else {
					const parsed = parseBody(body);
					if (parsed.err) {
						reject(parsed.err);
					} else {
						resolve(parsed.body);
					}
				}
			});
		});
		if (typeof callback === "function") {
			p.then(res => {
				callback(null, res);
			}).catch(err => {
				callback(err);
			});
		}
		return p;
	};

	const getBoards = callback => {
		return clientGet("boards", callback);
	};

	const getNewBoards = callback => {
		return clientGet("ListNewBoards", callback);
	};

	const getBoard = (boardId, callback) => {
		return clientGet(`boards/${boardId}`, callback);
	};

	const getBoardByName = (boardToFind, callback) => {
		const p = when.promise((resolve, reject) => {
			getBoards().then(boards => {
				if (boards && boards.length > 0) {
					const board = boards.find(b => {
						return b.Title === boardToFind;
					});
					if (board && board.Id > 0) {
						getBoard(board.Id).then(b => {
							resolve(b);
						}, err => {
							reject(err);
						});
					} else {
						reject(`[${boardToFind}] not found`);
					}
				} else {
					reject("No boards returned");
				}
			}, err => {
				reject(err);
			});
		});
		if (typeof callback === "function") {
			p.then(board => {
				callback(null, board);
			}, err => {
				callback(err);
			});
		}
		return p;
	};

	const getBoardIdentifiers = (boardId, callback) => {
		const p = when.promise((resolve, reject) => {
			if (boardId in boardIdentifiers) {
				resolve(boardIdentifiers[boardId]);
			} else {
				clientGet(`board/${boardId}/GetBoardIdentifiers`).then(data => {
					boardIdentifiers[boardId] = data;
					resolve(data);
				}, err => {
					reject(err);
				});
			}
		});
		if (typeof callback === "function") {
			p.then(data => {
				callback(null, data);
			}, err => {
				callback(err);
			});
		}
		return p;
	};

	const getBoardBacklogLanes = (boardId, callback) => {
		return clientGet(`board/${boardId}/backlog`, callback);
	};

	const getBoardArchiveLanes = (boardId, callback) => {
		return clientGet(`board/${boardId}/archive`, callback);
	};

	const getBoardArchiveCards = (boardId, callback) => {
		return clientGet(`board/${boardId}/archivecards`, callback);
	};

	const getNewerIfExists = (boardId, version, callback) => {
		return clientGet(`board/${boardId}/boardversion/${version}/getnewerifexists`, callback);
	};

	const getBoardHistorySince = (boardId, version, callback) => {
		return clientGet(`board/${boardId}/boardversion/${version}/getboardhistorysince`, callback);
	};

	const getBoardUpdates = (boardId, version, callback) => {
		return clientGet(`board/${boardId}/boardversion/${version}/checkforupdates`, callback);
	};

	const getCard = (boardId, cardId, callback) => {
		return clientGet(`board/${boardId}/getcard/${cardId}`, callback);
	};

	const getCardByExternalId = (boardId, externalCardId, callback) => {
		return clientGet(`board/${boardId}/getcardbyexternalid/${encodeURIComponent(externalCardId)}`, callback);
	};

	const addCardWithWipOverride = (boardId, laneId, position, wipOverrideReason, card, callback) => {
		// eslint-disable-line max-params
		card.UserWipOverrideComment = wipOverrideReason;
		return clientPost(`board/${boardId}/AddCardWithWipOverride/Lane/${laneId}/Position/${position}`, card, callback);
	};

	const addCard = (boardId, laneId, position, card, callback) => {
		return addCardWithWipOverride(boardId, laneId, position, defaultWipOverrideReason, card, callback);
	};

	const addCardsWithWipOverride = (boardId, cards, wipOverrideReason, callback) => {
		return clientPost(`board/${boardId}/AddCards?wipOverrideComment=${encodeURIComponent(wipOverrideReason)}`, cards, callback);
	};

	const addCards = (boardId, cards, callback) => {
		return addCardsWithWipOverride(boardId, cards, defaultWipOverrideReason, callback);
	};

	const moveCard = (boardId, cardId, toLaneId, position, wipOverrideReason, callback) => {
		// eslint-disable-line max-params
		return clientPost(`board/${boardId}/movecardwithwipoverride/${cardId}/lane/${toLaneId}/position/${position}`, {
			comment: wipOverrideReason
		}, callback);
	};

	const moveCardByExternalId = (boardId, externalCardId, toLaneId, position, wipOverrideReason, callback) => {
		// eslint-disable-line max-params
		return clientPost(`board/${boardId}/movecardbyexternalid/${encodeURIComponent(externalCardId)}/lane/${toLaneId}/position/${position}`, {
			comment: wipOverrideReason
		}, callback);
	};

	const moveCardToBoard = (cardId, destinationBoardId, callback) => {
		return clientPost(`card/movecardtoanotherboard/${cardId}/${destinationBoardId}`, null, callback);
	};

	const updateCard = (boardId, card, callback) => {
		card.UserWipOverrideComment = defaultWipOverrideReason;
		return clientPost(`board/${boardId}/UpdateCardWithWipOverride`, card, callback);
	};

	const updateCardFields = (updateFields, callback) => {
		return clientPost("card/update", updateFields, callback);
	};

	const updateCards = (boardId, cards, callback) => {
		return clientPost(`board/${boardId}/updatecards?wipoverridecomment=${encodeURIComponent(defaultWipOverrideReason)}`, cards, callback);
	};

	const getComments = (boardId, cardId, callback) => {
		return clientGet(`card/getcomments/${boardId}/${cardId}`, callback);
	};

	const addComment = (boardId, cardId, userId, comment, callback) => {
		const data = {
			PostedById: userId,
			Text: comment
		};
		return clientPost(`card/savecomment/${boardId}/${cardId}`, data, callback);
	};

	const addCommentByExternalId = (boardId, externalCardId, userId, comment, callback) => {
		const data = {
			PostedById: userId,
			Text: comment
		};
		return clientPost(`card/savecommentbyexternalid/${boardId}/${encodeURIComponent(externalCardId)}`, data, callback);
	};

	const getCardHistory = (boardId, cardId, callback) => {
		return clientGet(`card/history/${boardId}/${cardId}`, callback);
	};

	const searchCards = (boardId, searchOptions, callback) => {
		return clientPost(`board/${boardId}/searchcards`, searchOptions, callback);
	};

	const getNewCards = (boardId, callback) => {
		return clientGet(`board/${boardId}/listnewcards`, callback);
	};

	const deleteCard = (boardId, cardId, callback) => {
		return clientPost(`board/${boardId}/deletecard/${cardId}`, null, callback);
	};

	const deleteCards = (boardId, cardIds, callback) => {
		return clientPost(`board/${boardId}/deletecards`, cardIds, callback);
	};

	const getTaskboard = (boardId, cardId, callback) => {
		return clientGet(`v1/board/${boardId}/card/${cardId}/taskboard`, callback);
	};

	const addTask = (boardId, cardId, taskCard, callback) => {
		taskCard.UserWipOverrideComment = defaultWipOverrideReason;
		return clientPost(`v1/board/${boardId}/card/${cardId}/tasks/lane/${taskCard.LaneId}/position/${taskCard.Index}`, taskCard, callback);
	};

	const updateTask = (boardId, cardId, taskCard, callback) => {
		taskCard.UserWipOverrideComment = defaultWipOverrideReason;
		return clientPost(`v1/board/${boardId}/update/card/${cardId}/tasks/${taskCard.Id}`, taskCard, callback);
	};

	const deleteTask = (boardId, cardId, taskId, callback) => {
		return clientPost(`v1/board/${boardId}/delete/card/${cardId}/tasks/${taskId}`, null, callback);
	};

	const getTaskBoardUpdates = (boardId, cardId, version, callback) => {
		return clientGet(`v1/board/${boardId}/card/${cardId}/tasks/boardversion/${version}`, callback);
	};

	const moveTask = (boardId, cardId, taskId, toLaneId, position, callback) => {
		// eslint-disable-line max-params
		return clientPost(`v1/board/${boardId}/move/card/${cardId}/tasks/${taskId}/lane/${toLaneId}/position/${position}`, null, callback);
	};

	const getAttachmentCount = (boardId, cardId, callback) => {
		return clientGet(`card/GetAttachmentsCount/${boardId}/${cardId}`, callback);
	};

	const getAttachments = (boardId, cardId, callback) => {
		return clientGet(`card/GetAttachments/${boardId}/${cardId}`, callback);
	};

	const getAttachment = (boardId, cardId, attachmentId, callback) => {
		return clientGet(`card/GetAttachments/${boardId}/${cardId}/${attachmentId}`, callback);
	};

	const downloadAttachment = (boardId, attachmentId, file, callback) => {
		return clientSaveFile(`card/DownloadAttachment/${boardId}/${attachmentId}`, file, callback);
	};

	const deleteAttachment = (boardId, cardId, attachmentId, callback) => {
		return clientPost(`card/DeleteAttachment/${boardId}/${cardId}/${attachmentId}`, null, callback);
	};

	const addAttachment = (boardId, cardId, description, file, callback) => {
		let fileName;
		if (typeof file === "string") {
			fileName = path.basename(file);
		} else {
			fileName = path.basename(file.path);
		}
		const attachmentData = {
			Id: 0,
			Description: description,
			FileName: fileName
		};
		return clientSendFile(`card/SaveAttachment/${boardId}/${cardId}`, file, attachmentData, callback);
	};

	const getCurrentUserProfile = (boardId = 0) => {
		return clientGet(`api/user/getcurrentusersettings/${boardId}`);
	};

	return {
		addAttachment,
		addCard,
		addCards,
		addCardsWithWipOverride,
		addCardWithWipOverride,
		addComment,
		addCommentByExternalId,
		addTask,
		deleteAttachment,
		deleteCard,
		deleteCards,
		deleteTask,
		downloadAttachment,
		getAttachment,
		getAttachmentCount,
		getAttachments,
		getBoard,
		getBoardArchiveCards,
		getBoardArchiveLanes,
		getBoardBacklogLanes,
		getBoardByName,
		getBoardHistorySince,
		getBoardIdentifiers,
		getBoards,
		getBoardUpdates,
		getCard,
		getCardByExternalId,
		getCardHistory,
		getComments,
		getCurrentUserProfile,
		getNewBoards,
		getNewCards,
		getNewerIfExists,
		getTaskboard,
		getTaskBoardUpdates,
		moveCard,
		moveCardByExternalId,
		moveCardToBoard,
		moveTask,
		searchCards,
		updateCard,
		updateCardFields,
		updateCards,
		updateTask,
		_options: options
	};
};

exports.default = LeanKitClient;

module.exports = LeanKitClient;