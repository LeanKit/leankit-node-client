"use strict";

module.exports = (api, request) => {
	const defaultWipOverrideReason = "WIP Override performed by external system";
	api.card = {};

	api.card.get = (boardId, cardId) => {
		return request({ url: `board/${boardId}/getcard/${cardId}` });
	};

	api.card.get.by = {};
	api.card.get.by.externalCardId = (boardId, externalCardId) => {
		return request({ url: `board/${boardId}/getcardbyexternalid/${encodeURIComponent(externalCardId)}` });
	};

	api.card.create = (boardId, laneId, position, cardObject, wipOverrideReason = defaultWipOverrideReason) => {
		if (!cardObject.UserWipOverrideComment) {
			cardObject.UserWipOverrideComment = wipOverrideReason;
		}
		return request({
			url: `board/${boardId}/AddCardWithWipOverride/Lane/${laneId}/Position/${position}`,
			method: "POST",
			data: cardObject
		});
	};

	api.card.create.multiple = (boardId, cardsArray, wipOverrideReason = defaultWipOverrideReason) => {
		return request({
			url: `board/${boardId}/AddCards?wipOverrideComment=${encodeURIComponent(wipOverrideReason)}`,
			method: "POST",
			data: cardsArray
		});
	};

	api.card.move = (boardId, cardId, toLaneId, position, wipOverrideReason = defaultWipOverrideReason) => {
		return request({
			url: `board/${boardId}/movecardwithwipoverride/${cardId}/lane/${toLaneId}/position/${position}`,
			method: "POST",
			data: { comment: wipOverrideReason }
		});
	};

	api.card.move.by = {};
	api.card.move.by.externalCardId = (boardId, externalCardId, toLaneId, position, wipOverrideReason = defaultWipOverrideReason) => {
		return request({
			url: `board/${boardId}/movecardbyexternalid/${encodeURIComponent(externalCardId)}/lane/${toLaneId}/position/${position}`,
			method: "POST",
			data: { comment: wipOverrideReason }
		});
	};

	api.card.move.to = {};
	api.card.move.to.board = (cardId, destinationBoardId) => {
		return request({
			url: `card/movecardtoanotherboard/${cardId}/${destinationBoardId}`,
			method: "POST"
		});
	};

	api.card.update = (boardId, cardObject, wipOverrideReason = defaultWipOverrideReason) => {
		if (!cardObject.UserWipOverrideComment) {
			cardObject.UserWipOverrideComment = wipOverrideReason;
		}
		return request({
			url: `board/${boardId}/UpdateCardWithWipOverride`,
			method: "POST",
			data: cardObject
		});
	};

	api.card.update.fields = cardFieldsUpdateRequest => {
		return request({
			url: "card/update",
			method: "POST",
			data: cardFieldsUpdateRequest
		});
	};

	api.card.update.multiple = (boardId, cardsArray, wipOverrideReason = defaultWipOverrideReason) => {
		return request({
			url: `board/${boardId}/updatecards?wipoverridecomment=${encodeURIComponent(wipOverrideReason)}`,
			method: "POST",
			data: cardsArray
		});
	};
};