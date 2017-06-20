"use strict";

const account = require("./account");
const auth = require("./auth");
const board = require("./board");
const card = require("./card");
const cardAttachment = require("./card.attachment");
const cardComment = require("./card.comment");
const devices = require("./devices");
const organization = require("./organization");
const task = require("./task");
const template = require("./template");
const user = require("./user");
const userBoards = require("./userBoards");

module.exports = (api, request) => {
	account(api, request);
	auth(api, request);
	board(api, request);
	card(api, request);
	cardAttachment(api, request);
	cardComment(api, request);
	devices(api, request);
	organization(api, request);
	task(api, request);
	template(api, request);
	user(api, request);
	userBoards(api, request);
};