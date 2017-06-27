/* eslint-disable max-lines */
const req = require( "request" );
const utils = require( "./utils" );
const apiFactory = require( "./api" );
const v1ApiFactory = require( "./api.v1" );
const legacy = require( "./legacy" );

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
		baseUrl: utils.buildUrl( account ),
		headers
	};

	if ( proxy ) {
		defaults.proxy = proxy;
	}
	return defaults;
};

const rejectError = ( err, res, body, reject ) => {
	const message = res ? res.statusMessage : err.message;
	const reqErr = new Error( message );
	if ( err ) {
		reqErr.stack = err.stack;
	}
	if ( res ) {
		reqErr.status = res.statusCode;
		reqErr.statusText = res.statusMessage;
	}
	if ( body ) {
		try {
			reqErr.data = JSON.parse( body );
		} catch ( e ) {
			reqErr.data = body;
		}
	}
	return reject( reqErr );
};

const Client = ( { account, email, password, config } ) => {
	const defaults = buildDefaultConfig( account, email, password, config );
	const legacyHandler = legacy( req, defaults );

	const request = ( options, stream = null ) => {
		const cfg = utils.mergeOptions( options, defaults );

		if ( stream ) {
			return utils.streamResponse( req, cfg, stream );
		}

		return new Promise( ( resolve, reject ) => {
			req( cfg, ( err, res, body ) => {
				if ( err || res.statusCode < utils.status.status200 || res.statusCode >= utils.status.status300 ) {
					return rejectError( err, res, body, reject );
				}

				let data = null;
				try {
					data = body ? JSON.parse( body ) : "";
				} catch ( e ) {
					data = body;
				}

				return resolve( {
					status: res.statusCode,
					statusText: res.statusMessage,
					// headers: res.headers,
					data
				} );
			} );
		} );
	};

	const api = {};
	apiFactory( api, request, { accountName: account, email, password } );
	v1ApiFactory( api, legacyHandler.request, { accountName: account, email, password } );
	return api;
};

module.exports = Client;
