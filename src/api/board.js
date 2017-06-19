module.exports = ( api, request ) => {
	api.board = { customFields: {} };
	api.board.list = ( params = {} ) => {
		return request( {
			url: "/io/board",
			method: "get",
			params
		} );
	};

	api.board.get = boardId => {
		return request( {
			url: `/io/board/${ boardId }`,
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
};
