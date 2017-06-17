/* eslint-disable max-lines */
const axios = require( "axios" );
const utils = require( "./utils" );

const Client = ( { account, email, password, proxy } ) => {
	const userAgent = utils.getUserAgent();
	const defaults = {
		auth: {
			username: email,
			password
		},
		responseType: "json",
		baseURL: utils.buildUrl( account ),
		proxy,
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			"User-Agent": userAgent
		}
	};

	const request = options => {
		Object.assign( options, defaults );
		return axios.request( options )
			.then( res => {
				return {
					status: res.status,
					statusText: res.statusText,
					headers: res.headers,
					data: res.data
				};
			} )
			.catch( err => {
				const reqErr = new Error( err.message );
				reqErr.status = err.response.status;
				reqErr.statusText = err.response.statusText;
				reqErr.headers = err.response.headers;
				reqErr.data = err.response.data;
				throw reqErr;
			} );
	};

	const api = {
		account: {},
		auth: {},
		board: {
			customFields: {}
		},
		card: {},
		template: {},
		user: {},
		userBoards: {},
		task: {},
		organization: {},
		devices: {}
	};

	// Account
	api.account.get = () => {
		return request( { url: "/io/account", method: "get" } );
	};
	api.account.me = api.account.get;

	// Auth
	api.auth.listTokens = () => {
		return request( { url: "/io/auth/token", method: "get" } );
	};

	api.auth.createToken = description => {
		return request( {
			url: "/io/auth/token",
			method: "post",
			data: { description }
		} );
	};

	api.auth.revokeToken = id => {
		return request( {
			url: `/io/auth/token/${ id }`,
			method: "delete"
		} );
	};

	// Board
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
			data: { boardCreateRequest }
		} );
	};

	return api;
};

module.exports = Client;
