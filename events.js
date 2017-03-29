"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/* eslint-disable max-lines */
var EventEmitter = require("events").EventEmitter;
var changeCase = require("change-case");
var MS = 1000;
var DEFAULT_POLL_INTERVAL = 30;

var camelClone = function camelClone(obj) {
	var clone = {};
	for (var key in obj) {
		// eslint-disable-line guard-for-in
		var val = obj[key];
		if (val && (typeof val === "undefined" ? "undefined" : _typeof(val)) === "object") {
			val = camelClone(val);
		}
		clone[changeCase.camel(key)] = val;
	}
	return clone;
};

var LeanKitNotifier = function (_EventEmitter) {
	_inherits(LeanKitNotifier, _EventEmitter);

	function LeanKitNotifier(client, boardId) {
		var version = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
		var pollInterval = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : DEFAULT_POLL_INTERVAL;
		var resumeAfterError = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;

		_classCallCheck(this, LeanKitNotifier);

		var _this = _possibleConstructorReturn(this, (LeanKitNotifier.__proto__ || Object.getPrototypeOf(LeanKitNotifier)).call(this));

		_this.timer = 0;
		_this.client = client;
		_this.boardId = boardId;
		_this.version = version;
		_this.pollInterval = pollInterval;
		_this.resumeAfterError = resumeAfterError;
		return _this;
	}

	_createClass(LeanKitNotifier, [{
		key: "scheduleNextPoll",
		value: function scheduleNextPoll() {
			var _this2 = this;

			if (this.timer === 0) {
				_get(LeanKitNotifier.prototype.__proto__ || Object.getPrototypeOf(LeanKitNotifier.prototype), "emit", this).call(this, "debug", "scheduling next poll");
				this.timer = setTimeout(function () {
					_get(LeanKitNotifier.prototype.__proto__ || Object.getPrototypeOf(LeanKitNotifier.prototype), "emit", _this2).call(_this2, "debug", "scheduled poll starting...");
					return _this2.getUpdates();
				}, this.pollInterval * MS);
			}
			return this.timer;
		}
	}, {
		key: "checkForUpdates",
		value: function checkForUpdates() {
			var _this3 = this;

			_get(LeanKitNotifier.prototype.__proto__ || Object.getPrototypeOf(LeanKitNotifier.prototype), "emit", this).call(this, "debug", "calling client.getBoardUpdates...");
			return this.client.getBoardUpdates(this.boardId, this.version).then(function (res) {
				var events = [];
				_get(LeanKitNotifier.prototype.__proto__ || Object.getPrototypeOf(LeanKitNotifier.prototype), "emit", _this3).call(_this3, "debug", "client.getBoardUpdates, hasUpdates: " + res.HasUpdates);
				if (res.HasUpdates) {
					_get(LeanKitNotifier.prototype.__proto__ || Object.getPrototypeOf(LeanKitNotifier.prototype), "emit", _this3).call(_this3, "debug", "client.getBoardUpdates, events: " + res.Events.length);
					_this3.version = res.CurrentBoardVersion;
					res.Events.forEach(function (e) {
						var n = camelClone(e);
						n.boardVersion = _this3.version;
						n.eventType = changeCase.param(e.EventType).replace("-event", "");
						if (n.eventType === "board-edit" && res.NewPayload) {
							n.board = camelClone(res.NewPayload);
						}
						events.push(n);
					});
				}
				return events;
			});
		}
	}, {
		key: "getUpdates",
		value: function getUpdates() {
			var _this4 = this;

			this.timer = 0;
			if (!this.version) {
				_get(LeanKitNotifier.prototype.__proto__ || Object.getPrototypeOf(LeanKitNotifier.prototype), "emit", this).call(this, "debug", "no board version specified, getting current board");
				this.client.getBoard(this.boardId).then(function (board) {
					_get(LeanKitNotifier.prototype.__proto__ || Object.getPrototypeOf(LeanKitNotifier.prototype), "emit", _this4).call(_this4, "debug", "current board version: " + board.Version);
					_this4.version = board.Version;
					_this4.getUpdates();
				}, function (err) {
					_get(LeanKitNotifier.prototype.__proto__ || Object.getPrototypeOf(LeanKitNotifier.prototype), "emit", _this4).call(_this4, "error", err);
					if (_this4.resumeAfterError) {
						_this4.scheduleNextPoll();
					}
				});
			} else {
				_get(LeanKitNotifier.prototype.__proto__ || Object.getPrototypeOf(LeanKitNotifier.prototype), "emit", this).call(this, "polling", { id: this.boardId, version: this.version });
				this.checkForUpdates().then(function (events) {
					_get(LeanKitNotifier.prototype.__proto__ || Object.getPrototypeOf(LeanKitNotifier.prototype), "emit", _this4).call(_this4, "debug", "events: " + events.length);
					if (events && events.length > 0) {
						events.forEach(function (e) {
							_get(LeanKitNotifier.prototype.__proto__ || Object.getPrototypeOf(LeanKitNotifier.prototype), "emit", _this4).call(_this4, e.eventType, e);
						});
					}
					_this4.scheduleNextPoll();
				}, function (err) {
					_get(LeanKitNotifier.prototype.__proto__ || Object.getPrototypeOf(LeanKitNotifier.prototype), "emit", _this4).call(_this4, "error", err);
					if (_this4.resumeAfterError) {
						_this4.scheduleNextPoll();
					}
				});
			}
		}
	}, {
		key: "start",
		value: function start() {
			_get(LeanKitNotifier.prototype.__proto__ || Object.getPrototypeOf(LeanKitNotifier.prototype), "emit", this).call(this, "debug", "starting event polling...");
			return this.getUpdates();
		}
	}, {
		key: "stop",
		value: function stop() {
			_get(LeanKitNotifier.prototype.__proto__ || Object.getPrototypeOf(LeanKitNotifier.prototype), "emit", this).call(this, "debug", "stopping event polling...");
			if (this.timer) {
				_get(LeanKitNotifier.prototype.__proto__ || Object.getPrototypeOf(LeanKitNotifier.prototype), "emit", this).call(this, "debug", "clearing timer...");
				clearTimeout(this.timer);
				this.timer = 0;
			}
		}
	}]);

	return LeanKitNotifier;
}(EventEmitter);

exports.default = LeanKitNotifier;
module.exports = exports["default"];