module.exports = ( api, request ) => {
	api.board = { customFields: {}, roles: {} };
	api.board.list = ( params = {} ) => {
		return request( {
			url: "/io/board",
			method: "get",
			qs: params
		} );
	};

	api.board.get = boardId => {
		return request( {
			url: `/io/board/${ boardId }`,
			method: "get"
		} );
	};

	api.board.changes = ( boardId, version ) => {
		return request( {
			url: `/io/board/${ boardId }/changes?version=${ version }`,
			method: "get"
		} );
	};

	api.board.cards = ( { boardId, cards, lanes} ) => {
		let qs = "";
		if( cards ){
			if( typeof( cards ) === "object" ) {
				cards = cards.join();
			}
			qs+= `cards=${ cards }&`;
		}
		if( lanes ) {
			if( typeof( lanes ) === "object" ) {
				lanes = lanes.join();
			}
			qs+= `lanes=${ lanes }`;
		}
		return request( {
			url: `/io/board/${ boardId }/card?${ qs }`,
			method: "get"
		} );
	};


	api.board.customFields.list = boardId => {
		return request( {
			url: `/io/board/${ boardId }/customfield`,
			method: "get"
		} );
	};

	api.board.customFields.update = ( boardId, operations ) => {
		return request( {
			url: `/io/board/${ boardId }/customfield`,
			method: "patch",
			data: operations
		} );
	};

	api.board.create = boardCreateRequest => {
		return request( {
			url: "/io/board",
			method: "post",
			data: boardCreateRequest
		} );
	};

	api.board.roles.modify = ( boardId, operations ) => {
		return request( {
			url: `/io/board/${ boardId }/roles`,
			method: "patch",
			data: operations
		} );
	};
};
