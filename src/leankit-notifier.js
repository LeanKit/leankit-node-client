const EventEmitter = require( "events" ).EventEmitter;

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

	getUpdates() {
		this.timer = 0;
		super.emit( "polling", { id: this.boardId, version: this.version } );
		this.client.getBoardUpdates( this.boardId, this.version, ( err, res ) => {
			if ( err ) {
				super.emit( "error", err );
			} else if ( res.HasUpdates ) {
				super.emit( "update", res );
			}
			this.timer = this.waitForNextPoll();
		} );
	}

	start() {
		this.getUpdates();
	}

	stop() {
		if ( this.timer ) {
			clearTimeout( this.timer );
		}
	}

}
