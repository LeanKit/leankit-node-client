"use strict";

const fs = require("fs");
const path = require("path");

const buildUrl = account => {
	let url = "";
	if (account.indexOf("http://") !== 0 && account.indexOf("https://") !== 0) {
		url = `https://${account}`;
		// Assume leankit.com if no domain is specified
		if (account.indexOf(".") === -1) {
			url += ".leankit.com";
		}
	} else {
		url = account;
	}
	if (url.indexOf("/", account.length - 1) !== 0) {
		url += "/";
	}
	return url;
};

const getUserAgent = () => {
	const pkgfilepath = path.resolve(__dirname, "../", "package.json");
	if (fs.existsSync(pkgfilepath)) {
		const pkg = JSON.parse(fs.readFileSync(pkgfilepath, "utf-8"));
		return `leankit-node-client/${pkg.version}`;
	}
	return "leankit-node-client/2.0.0";
};

const getPropertyValue = (obj, prop, def = null) => {
	for (const k in obj) {
		if (k.toLowerCase() === prop.toLowerCase()) {
			return obj[k];
		}
	}
	return def;
};

const removeProperties = (obj, props) => {
	for (let i = 0; i < props.length; i++) {
		for (const k in obj) {
			if (k.toLowerCase() === props[i].toLowerCase()) {
				delete obj[k];
			}
		}
	}
};

const checkLegacyPath = urlPath => {
	return urlPath.startsWith("api/") ? urlPath : `kanban/api/${urlPath}`;
};

const parseBody = body => {
	let parsed;
	if (typeof body === "string" && body !== "") {
		try {
			parsed = JSON.parse(body);
		} catch (e) {
			parsed = body;
		}
	} else {
		parsed = body;
	}
	return parsed;
};

module.exports = {
	buildUrl,
	getUserAgent,
	getPropertyValue,
	removeProperties,
	checkLegacyPath,
	parseBody
};