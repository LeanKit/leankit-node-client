"use strict";

module.exports = (api, request) => {
	if (!api.card) {
		api.card = { attachment: {}, comment: {} };
	}

	api.card.comment.list = cardId => {
		return request({
			url: `/io/card/${cardId}/comment`,
			method: "get"
		});
	};

	api.card.comment.create = (cardId, text) => {
		return request({
			url: `/io/card/${cardId}/comment`,
			method: "post",
			data: { text }
		});
	};

	api.card.comment.update = (cardId, commentId, text) => {
		return request({
			url: `/io/card/${cardId}/comment/${commentId}`,
			method: "put",
			data: { text }
		});
	};

	api.card.comment.destroy = (cardId, commentId, text) => {
		return request({
			url: `/io/card/${cardId}/comment/${commentId}`,
			method: "delete"
		});
	};
};