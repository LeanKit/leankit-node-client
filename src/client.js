/* eslint-disable max-lines */
const axios = require( "axios" );
const utils = require( "./utils" );
const apiFactory = require( "./api" );

const buildDefaultConfig = ( account, email, password, config ) => {
	config = config || { headers: {} };
	if ( !config.headers ) {
		config.headers = {};
	}
	const userAgent = utils.getPropertyValue( config.headers, "User-Agent", utils.getUserAgent() );
	utils.removeProperties( config.headers, [ "User-Agent", "Content-Type", "Accept" ] );
	const proxy = config.proxy || null;
	const defaultHeaders = {
		Accept: "application/json",
		"Content-Type": "application/json",
		"User-Agent": userAgent
	};
	const headers = Object.assign( {}, config.headers, defaultHeaders );
	const defaults = {
		auth: {
			username: email,
			password
		},
		responseType: "json",
		baseURL: utils.buildUrl( account ),
		headers
	};

	if ( proxy ) {
		defaults.proxy = proxy;
	}
	return defaults;
};

const Client = ( { account, email, password, config } ) => {
	const defaults = buildDefaultConfig( account, email, password, config );

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

	const api = {};

	apiFactory( api, request );

	return api;
};

module.exports = Client;
