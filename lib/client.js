"use strict";

/* eslint-disable max-lines */
const req = require("request");
const utils = require("./utils");
const apiFactory = require("./api");
const v1ApiFactory = require("./api.v1");
const STATUS_200 = 200;
const STATUS_201 = 201;

const buildDefaultConfig = (account, email, password, config) => {
	config = config || { headers: {} };
	if (!config.headers) {
		config.headers = {};
	}
	const userAgent = utils.getPropertyValue(config.headers, "User-Agent", utils.getUserAgent());
	utils.removeProperties(config.headers, ["User-Agent", "Content-Type", "Accept"]);
	const proxy = config.proxy || null;
	const defaultHeaders = {
		Accept: "application/json",
		"Content-Type": "application/json",
		"User-Agent": userAgent
	};
	const headers = Object.assign({}, config.headers, defaultHeaders);
	const defaults = {
		auth: {
			username: email,
			password
		},
		baseUrl: utils.buildUrl(account),
		headers
	};

	if (proxy) {
		defaults.proxy = proxy;
	}
	return defaults;
};

const Client = ({ account, email, password, config }) => {
	const defaults = buildDefaultConfig(account, email, password, config);

	const request = (options, stream = null) => {
		if (options.headers) {
			options.headers.Accept = defaults.headers.Accept;
			options.headers["User-Agent"] = defaults.headers["User-Agent"];
		}
		const cfg = Object.assign({}, defaults, options);
		if (cfg.data) {
			if (cfg.headers["Content-Type"] === "application/json") {
				cfg.body = JSON.stringify(cfg.data);
			} else {
				cfg.body = cfg.data;
			}
			delete cfg.data;
		}

		if (stream) {
			return new Promise((resolve, reject) => {
				const response = {};
				req(cfg).on("error", err => {
					return reject(err);
				}).on("response", res => {
					response.status = res.statusCode;
					response.statusText = res.statusMessage;
					response.data = "";
				}).on("end", () => {
					if (response.status < 200 || response.status >= 300) {
						// eslint-disable-line no-magic-numbers
						return reject(response);
					}
					return resolve(response);
				}).pipe(stream);
			});
		}

		return new Promise((resolve, reject) => {
			req(cfg, (err, res, body) => {
				if (err || res.statusCode < 200 || res.statusCode >= 300) {
					// eslint-disable-line no-magic-numbers
					const message = res ? res.statusMessage : err.message;
					const reqErr = new Error(message);
					if (err) {
						reqErr.stack = err.stack;
					}
					if (res) {
						reqErr.status = res.statusCode;
						reqErr.statusText = res.statusMessage;
						// reqErr.headers = res.headers;
					}
					if (body) {
						try {
							reqErr.data = JSON.parse(body);
						} catch (e) {
							reqErr.data = body;
						}
					}
					return reject(reqErr);
				}

				let data = null;
				try {
					data = body ? JSON.parse(body) : "";
				} catch (e) {
					data = body;
				}

				return resolve({
					status: res.statusCode,
					statusText: res.statusMessage,
					// headers: res.headers,
					data
				});
			});
		});
	};

	const parseReplyData = (error, response, body, resolve, reject) => {
		// eslint-disable-line max-statements
		const parsed = utils.parseBody(body);
		if (error) {
			const message = response ? response.statusMessage : response.message;
			const reqErr = new Error(message);
			reqErr.stack = error.stack;
			if (response) {
				reqErr.status = response.statusCode;
				reqErr.statusText = response.statusMessage;
			}
			reqErr.data = parsed;
			return reject(reqErr);
		}
		if (response.statusCode !== STATUS_200) {
			const err = new Error(response.statusText);
			err.name = "clientRequestError";
			err.replyCode = response.statusCode;
			err.data = parsed;
			return reject(err);
		}
		if (parsed && parsed.ReplyCode && parsed.ReplyCode >= 300) {
			// eslint-disable-line no-magic-numbers
			const err = new Error(parsed.ReplyText || "apiError");
			err.name = "apiError";
			err.httpStatusCode = parsed.ReplyCode;
			err.replyCode = parsed.ReplyCode;
			err.replyText = parsed.ReplyText;
			err.replyData = parsed.ReplyData;
			return reject(err);
		}
		if (parsed && parsed.ReplyCode && parsed.ReplyCode !== STATUS_200 && parsed.ReplyCode !== STATUS_201) {
			return resolve(parsed);
		}
		if (parsed.ReplyData && parsed.ReplyData.length > 0) {
			return resolve({
				status: parsed.ReplyCode,
				statusText: parsed.ReplyText,
				data: parsed.ReplyData[0]
			});
		}
		return resolve(parsed);
	};

	const legacyRequest = options => {
		options.url = utils.checkLegacyPath(options.url);
		if (options.headers) {
			options.headers.Accept = defaults.headers.Accept;
			options.headers["User-Agent"] = defaults.headers["User-Agent"];
		}
		const cfg = Object.assign({}, defaults, options);
		if (cfg.data) {
			if (cfg.headers["Content-Type"] === "application/json") {
				cfg.body = JSON.stringify(cfg.data);
			} else {
				cfg.body = cfg.data;
			}
			delete cfg.data;
		}
		return new Promise((resolve, reject) => {
			req(cfg, (err, res, body) => {
				return parseReplyData(err, res, body, resolve, reject);
			});
		});
	};

	const api = {};
	apiFactory(api, request, { accountName: account, email, password });
	v1ApiFactory(api, legacyRequest, { accountName: account, email, password });
	return api;
};

module.exports = Client;