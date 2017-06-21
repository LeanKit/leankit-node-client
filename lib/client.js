"use strict";

/* eslint-disable max-lines */
const req = require("request");
const utils = require("./utils");
const apiFactory = require("./api");

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

	const api = {};
	apiFactory(api, request, { accountName: account, email, password });
	return api;
};

module.exports = Client;