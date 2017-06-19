"use strict";

module.exports = (api, request) => {
	api.auth = { token: {} };
	api.auth.token.list = () => {
		return request({ url: "/io/auth/token", method: "get" });
	};

	api.auth.token.create = description => {
		return request({
			url: "/io/auth/token",
			method: "post",
			data: { description }
		});
	};

	api.auth.token.revoke = id => {
		return request({
			url: `/io/auth/token/${id}`,
			method: "delete"
		});
	};
};