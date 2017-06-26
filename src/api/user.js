module.exports = ( api, request ) => {
	api.user = { boards: {} };
	api.user.list = ( params = {} ) => {
		return request( {
			url: "/io/user",
			method: "get",
			qs: params
		} );
	};

	api.user.me = () => {
		return request( {
			url: "/io/user/me",
			method: "get"
		} );
	};

	api.user.get = userId => {
		return request( {
			url: `/io/user/${ userId }`,
			method: "get"
		} );
	};

	api.user.boards.recent = () => {
		return request( {
			url: "io/user/me/board/recent",
			method: "get"
		} );
	};
};
