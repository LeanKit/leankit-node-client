"use strict";

module.exports = (api, request) => {
	api.template = {};
	api.template.list = () => {
		return request({
			url: "/io/template",
			method: "get"
		});
	};

	api.template.create = templateCreateRequest => {
		return request({
			url: "/io/template",
			method: "post",
			data: templateCreateRequest
		});
	};

	api.template.destroy = id => {
		return request({
			url: `/io/template/${id}`,
			method: "delete"
		});
	};
};