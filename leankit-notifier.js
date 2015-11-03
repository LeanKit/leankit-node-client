"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventEmitter = require("events").EventEmitter;

var LeanKitNotifier = (function (_EventEmitter) {
	_inherits(LeanKitNotifier, _EventEmitter);

	function LeanKitNotifier(client, boardId, version, pollInterval) {
		_classCallCheck(this, LeanKitNotifier);

		_get(Object.getPrototypeOf(LeanKitNotifier.prototype), "constructor", this).call(this);
		this.timer = 0;
		this.client = client;
		this.boardId = boardId;
		this.version = version || 1;
		this.pollInterval = pollInterval || 5;
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
		key: "getUpdates",
		value: function getUpdates() {
			var _this2 = this;

			this.timer = 0;
			_get(Object.getPrototypeOf(LeanKitNotifier.prototype), "emit", this).call(this, "polling", { id: this.boardId, version: this.version });
			this.client.getBoardUpdates(this.boardId, this.version, function (err, res) {
				if (err) {
					_get(Object.getPrototypeOf(LeanKitNotifier.prototype), "emit", _this2).call(_this2, "error", err);
				} else if (res.HasUpdates) {
					_get(Object.getPrototypeOf(LeanKitNotifier.prototype), "emit", _this2).call(_this2, "update", res);
				}
				_this2.timer = _this2.waitForNextPoll();
			});
		}
	}, {
		key: "start",
		value: function start() {
			this.getUpdates();
		}
	}, {
		key: "stop",
		value: function stop() {
			if (this.timer) {
				clearTimeout(this.timer);
			}
		}
	}]);

	return LeanKitNotifier;
})(EventEmitter);

exports["default"] = LeanKitNotifier;
module.exports = exports["default"];