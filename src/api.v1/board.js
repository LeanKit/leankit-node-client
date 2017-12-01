module.exports = ( api, request ) => {
	api.board = { since: {} };
	api.board.list = () => {
		return request( { url: "boards" } );
	};

	api.board.get = boardId => {
		return request( { url: `boards/${ boardId }` } );
	};

	api.board.identifiers = boardId => {
		return request( { url: `board/${ boardId }/GetBoardIdentifiers` } );
	};

	api.board.backlog = boardId => {
		return request( { url: `board/${ boardId }/backlog` } );
	};

	api.board.archive = boardId => {
		return request( { url: `board/${ boardId }/archive` } );
	};

	api.board.archive.cards = boardId => {
		return request( { url: `board/${ boardId }/archivecards` } );
	};

	api.board.since.version = ( boardId, version ) => {
		return request( { url: `board/${ boardId }/boardversion/${ version }/getnewerifexists` } );
	};

	api.board.since.version.history = ( boardId, version ) => {
		return request( { url: `board/${ boardId }/boardversion/${ version }/getboardhistorysince` } );
	};

	api.board.since.version.updates = ( boardId, version ) => {
		return request( { url: `board/${ boardId }/boardversion/${ version }/checkforupdates` } );
	};
};
