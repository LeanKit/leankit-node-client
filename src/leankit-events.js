const EventEmitter = require( "events" ).EventEmitter;
const when = require( "when" );
const changeCase = require( "change-case" );

export default class LeanKitNotifier extends EventEmitter {
	constructor( client, boardId, version, pollInterval ) {
		super();
		this.timer = 0;
		this.client = client;
		this.boardId = boardId;
		this.version = version || 1;
		this.pollInterval = pollInterval || 5;
		// super.call( this );
	}

	waitForNextPoll() {
		return setTimeout( () => {
			this.getUpdates();
		}, this.pollInterval * 1000 );
	}

	camelClone( obj ) {
		var clone = {};
		for ( let key in obj ) {
			let val = obj[key];
			if ( val && typeof val === "object" ) {
				val = this.camelClone( val );
			}
			clone[changeCase.camel( key )] = val;
		}
		return clone;
	}

	getUpdates( callback ) {
		this.timer = 0;
		super.emit( "polling", { id: this.boardId, version: this.version } );
		this.client.getBoardUpdates( this.boardId, this.version, ( err, res ) => {
			if ( err ) {
				super.emit( "error", err );
				if ( typeof callback === "function" ) {
					callback( err );
				}
			} else if ( res.HasUpdates ) {
				this.version = res.CurrentBoardVersion;
				let events = [];
				res.Events.forEach( ( e ) => {
					let n = this.camelClone( e );
					n.boardVersion = this.version;
					n.eventType = changeCase.param( e.EventType ).replace( "-event", "" );
					if ( n.eventType === "board-edit" && res.NewPayload ) {
						n.board = this.camelClone( res.NewPayload );
						// console.log( n );
					}
					events.push( n );
					super.emit( n.eventType, n );
				} );

				if ( typeof callback === "function" ) {
					callback( null, events );
				} else {
					this.timer = this.waitForNextPoll();
				}
			} else {
				this.timer = this.waitForNextPoll();
			}
		} );
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
		}
	}

}
