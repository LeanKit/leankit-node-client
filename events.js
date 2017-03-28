"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/* eslint-disable max-lines */
var EventEmitter = require("events").EventEmitter;
var when = require("when");
var changeCase = require("change-case");
var MS = 1000;
var DEFAULT_POLL_INTERVAL = 30;

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
		key: "waitForNextPoll",
		value: function waitForNextPoll() {
			var _this2 = this;

			return setTimeout(function () {
				_this2.getUpdates();
			}, this.pollInterval * MS);
		}
	}, {
		key: "camelClone",
		value: function camelClone(obj) {
			var clone = {};
			for (var key in obj) {
				// eslint-disable-line guard-for-in
				var val = obj[key];
				if (val && (typeof val === "undefined" ? "undefined" : _typeof(val)) === "object") {
					val = this.camelClone(val);
				}
				clone[changeCase.camel(key)] = val;
			}
			return clone;
		}
	}, {
		key: "getUpdates",
		value: function getUpdates(callback) {
			var _this3 = this;

			this.timer = 0;
			if (!this.version) {
				this.client.getBoard(this.boardId, function (err, board) {
					if (err) {
						_get(LeanKitNotifier.prototype.__proto__ || Object.getPrototypeOf(LeanKitNotifier.prototype), "emit", _this3).call(_this3, "error", err);
						throw err;
					} else {
						_this3.version = board.Version;
						_this3.getUpdates(callback);
					}
				});
			} else {
				_get(LeanKitNotifier.prototype.__proto__ || Object.getPrototypeOf(LeanKitNotifier.prototype), "emit", this).call(this, "polling", { id: this.boardId, version: this.version });
				this.client.getBoardUpdates(this.boardId, this.version, function (err, res) {
					// eslint-disable-line consistent-return
					if (err) {
						_get(LeanKitNotifier.prototype.__proto__ || Object.getPrototypeOf(LeanKitNotifier.prototype), "emit", _this3).call(_this3, "error", err);
						if (_this3.resumeAfterError) {
							_this3.timer = _this3.waitForNextPoll();
						}
						if (typeof callback === "function") {
							return callback(err);
						}
					} else if (res.HasUpdates) {
						_this3.version = res.CurrentBoardVersion;
						var events = [];
						res.Events.forEach(function (e) {
							var n = _this3.camelClone(e);
							n.boardVersion = _this3.version;
							n.eventType = changeCase.param(e.EventType).replace("-event", "");
							if (n.eventType === "board-edit" && res.NewPayload) {
								n.board = _this3.camelClone(res.NewPayload);
							}
							events.push(n);
							_get(LeanKitNotifier.prototype.__proto__ || Object.getPrototypeOf(LeanKitNotifier.prototype), "emit", _this3).call(_this3, n.eventType, n);
						});

						if (typeof callback === "function") {
							return callback(null, events);
						}
						_this3.timer = _this3.waitForNextPoll();
					} else {
						_this3.timer = _this3.waitForNextPoll();
					}
				});
			}
		}
	}, {
		key: "start",
		value: function start() {
			this.getUpdates();
		}
	}, {
		key: "waitForNextUpdate",
		value: function waitForNextUpdate() {
			var _this4 = this;

			return when.promise(function (resolve, reject) {
				_this4.getUpdates(function (err, res) {
					if (err) {
						reject(err);
					} else {
						resolve(res);
					}
				});
			});
		}
	}, {
		key: "stop",
		value: function stop() {
			if (this.timer) {
				clearTimeout(this.timer);
				this.timer = 0;
			}
		}
	}]);

	return LeanKitNotifier;
}(EventEmitter);

exports.default = LeanKitNotifier;
module.exports = exports["default"];