/* eslint-disable max-lines */
const EventEmitter = require( "events" ).EventEmitter;
const changeCase = require( "change-case" );
const MS = 1000;
const DEFAULT_POLL_INTERVAL = 30;

const camelClone = obj => {
	const clone = {};
	for ( const key in obj ) { // eslint-disable-line guard-for-in
		let val = obj[ key ];
		if ( val && typeof val === "object" ) {
			val = camelClone( val );
		}
		clone[ changeCase.camel( key ) ] = val;
	}
	return clone;
};

export default class LeanKitNotifier extends EventEmitter {
	constructor( client, boardId, version = 0, pollInterval = DEFAULT_POLL_INTERVAL, resumeAfterError = true ) {
		super();
		this.timer = 0;
		this.client = client;
		this.boardId = boardId;
		this.version = version;
		this.pollInterval = pollInterval;
		this.resumeAfterError = resumeAfterError;
	}

	scheduleNextPoll() {
		if ( this.timer === 0 ) {
			super.emit( "debug", "scheduling next poll" );
			this.timer = setTimeout( () => {
				super.emit( "debug", "scheduled poll starting..." );
				return this.getUpdates();
			}, this.pollInterval * MS );
		}
		return this.timer;
	}

	checkForUpdates() {
		super.emit( "debug", "calling client.getBoardUpdates..." );
		return this.client.getBoardUpdates( this.boardId, this.version ).then( res => {
			const events = [];
			super.emit( "debug", `client.getBoardUpdates, hasUpdates: ${ res.HasUpdates }` );
			if ( res.HasUpdates ) {
				super.emit( "debug", `client.getBoardUpdates, events: ${ res.Events.length }` );
				this.version = res.CurrentBoardVersion;
				res.Events.forEach( e => {
					const n = camelClone( e );
					n.boardVersion = this.version;
					n.eventType = changeCase.param( e.EventType ).replace( "-event", "" );
					if ( n.eventType === "board-edit" && res.NewPayload ) {
						n.board = camelClone( res.NewPayload );
					}
					events.push( n );
				} );
			}
			return events;
		} );
	}

	getUpdates() {
		this.timer = 0;
		if ( !this.version ) {
			super.emit( "debug", "no board version specified, getting current board" );
			this.client.getBoard( this.boardId ).then( board => {
				super.emit( "debug", `current board version: ${ board.Version }` );
				this.version = board.Version;
				this.getUpdates();
			}, err => {
				super.emit( "error", err );
				if ( this.resumeAfterError ) {
					this.scheduleNextPoll();
				}
			} );
		} else {
			super.emit( "polling", { id: this.boardId, version: this.version } );
			this.checkForUpdates().then( events => {
				super.emit( "debug", `events: ${ events.length }` );
				if ( events && events.length > 0 ) {
					events.forEach( e => {
						super.emit( e.eventType, e );
					} );
				}
				this.scheduleNextPoll();
			}, err => {
				super.emit( "error", err );
				if ( this.resumeAfterError ) {
					this.scheduleNextPoll();
				}
			} );
		}
	}

	start() {
		super.emit( "debug", "starting event polling..." );
		return this.getUpdates();
	}

	stop() {
		super.emit( "debug", "stopping event polling..." );
		if ( this.timer ) {
			super.emit( "debug", "clearing timer..." );
			clearTimeout( this.timer );
			this.timer = 0;
		}
	}

}
