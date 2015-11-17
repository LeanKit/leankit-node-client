"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventEmitter = require("events").EventEmitter;
var when = require("when");
var changeCase = require("change-case");

var LeanKitNotifier = (function (_EventEmitter) {
	_inherits(LeanKitNotifier, _EventEmitter);

	function LeanKitNotifier(client, boardId, version, pollInterval) {
		_classCallCheck(this, LeanKitNotifier);

		_get(Object.getPrototypeOf(LeanKitNotifier.prototype), "constructor", this).call(this);
		this.timer = 0;
		this.client = client;
		this.boardId = boardId;
		this.version = version || 0;
		this.pollInterval = pollInterval || 30;
		// super.call( this );
	}

	_createClass(LeanKitNotifier, [{
		key: "waitForNextPoll",
		value: function waitForNextPoll() {
			var _this = this;

			return setTimeout(function () {
				_this.getUpdates();
			}, this.pollInterval * 1000);
		}
	}, {
		key: "camelClone",
		value: function camelClone(obj) {
			var clone = {};
			for (var key in obj) {
				var val = obj[key];
				if (val && typeof val === "object") {
					val = this.camelClone(val);
				}
				clone[changeCase.camel(key)] = val;
			}
			return clone;
		}
	}, {
		key: "getUpdates",
		value: function getUpdates(callback) {
			var _this2 = this;

			this.timer = 0;
			if (this.version === 0) {
				this.client.getBoard(this.boardId, function (err, board) {
					if (err) {
						throw err;
					} else {
						_this2.version = board.Version;
						_this2.getUpdates(callback);
					}
				});
			} else {
				_get(Object.getPrototypeOf(LeanKitNotifier.prototype), "emit", this).call(this, "polling", { id: this.boardId, version: this.version });
				this.client.getBoardUpdates(this.boardId, this.version, function (err, res) {
					if (err) {
						_get(Object.getPrototypeOf(LeanKitNotifier.prototype), "emit", _this2).call(_this2, "error", err);
						if (typeof callback === "function") {
							callback(err);
						}
					} else if (res.HasUpdates) {
						(function () {
							_this2.version = res.CurrentBoardVersion;
							var events = [];
							res.Events.forEach(function (e) {
								var n = _this2.camelClone(e);
								n.boardVersion = _this2.version;
								n.eventType = changeCase.param(e.EventType).replace("-event", "");
								if (n.eventType === "board-edit" && res.NewPayload) {
									n.board = _this2.camelClone(res.NewPayload);
									// console.log( n );
								}
								events.push(n);
								_get(Object.getPrototypeOf(LeanKitNotifier.prototype), "emit", _this2).call(_this2, n.eventType, n);
							});

							if (typeof callback === "function") {
								callback(null, events);
							} else {
								_this2.timer = _this2.waitForNextPoll();
							}
						})();
					} else {
						_this2.timer = _this2.waitForNextPoll();
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
			var _this3 = this;

			return when.promise(function (resolve, reject) {
				_this3.getUpdates(function (err, res) {
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
})(EventEmitter);

exports["default"] = LeanKitNotifier;
module.exports = exports["default"];