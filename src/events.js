/* eslint-disable max-lines */
const EventEmitter = require( "events" ).EventEmitter;
const when = require( "when" );
const changeCase = require( "change-case" );
const MS = 1000;
const DEFAULT_POLL_INTERVAL = 30;

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

	waitForNextPoll() {
		return setTimeout( () => {
			this.getUpdates();
		}, this.pollInterval * MS );
	}

	camelClone( obj ) {
		const clone = {};
		for ( const key in obj ) { // eslint-disable-line guard-for-in
			let val = obj[ key ];
			if ( val && typeof val === "object" ) {
				val = this.camelClone( val );
			}
			clone[ changeCase.camel( key ) ] = val;
		}
		return clone;
	}

	getUpdates( callback ) {
		this.timer = 0;
		if ( !this.version ) {
			this.client.getBoard( this.boardId, ( err, board ) => {
				if ( err ) {
					super.emit( "error", err );
					throw err;
				} else {
					this.version = board.Version;
					this.getUpdates( callback );
				}
			} );
		} else {
			super.emit( "polling", { id: this.boardId, version: this.version } );
			this.client.getBoardUpdates( this.boardId, this.version, ( err, res ) => { // eslint-disable-line consistent-return
				if ( err ) {
					super.emit( "error", err );
					if ( this.resumeAfterError ) {
						this.timer = this.waitForNextPoll();
					}
					if ( typeof callback === "function" ) {
						return callback( err );
					}
				} else if ( res.HasUpdates ) {
					this.version = res.CurrentBoardVersion;
					const events = [];
					res.Events.forEach( e => {
						const n = this.camelClone( e );
						n.boardVersion = this.version;
						n.eventType = changeCase.param( e.EventType ).replace( "-event", "" );
						if ( n.eventType === "board-edit" && res.NewPayload ) {
							n.board = this.camelClone( res.NewPayload );
						}
						events.push( n );
						super.emit( n.eventType, n );
					} );

					if ( typeof callback === "function" ) {
						return callback( null, events );
					}
					this.timer = this.waitForNextPoll();
				} else {
					this.timer = this.waitForNextPoll();
				}
			} );
		}
	}

	start() {
		this.getUpdates();
	}

	waitForNextUpdate() {
		return when.promise( ( resolve, reject ) => {
			this.getUpdates( ( err, res ) => {
				if ( err ) {
					reject( err );
				} else {
					resolve( res );
				}
			} );
		} );
	}

	stop() {
		if ( this.timer ) {
			clearTimeout( this.timer );
			this.timer = 0;
		}
	}

}
