"use strict";

module.exports = (api, request) => {
	if (!api.card) {
		api.card = { attachment: {}, comment: {} };
	}
	api.card.list = (params = {}) => {
		return request({
			url: "/io/card",
			method: "get",
			qs: params
		});
	};

	api.card.get = cardId => {
		return request({
			url: `/io/card/${cardId}`,
			method: "get"
		});
	};

	api.card.create = cardCreateRequest => {
		return request({
			url: "/io/card",
			method: "post",
			data: cardCreateRequest
		});
	};

	api.card.update = (cardId, operations) => {
		if (!Array.isArray(operations)) {
			operations = [operations];
		}
		return request({
			url: `/io/card/${cardId}`,
			method: "patch",
			data: operations
		});
	};

	api.card.destroy = cardId => {
		return request({
			url: `/io/card/${cardId}`,
			method: "delete"
		});
	};

	api.card.comment.list = cardId => {
		return request({
			url: `/io/card/${cardId}/comment`,
			method: "get"
		});
	};
};