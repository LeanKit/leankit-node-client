/* eslint-disable max-lines */
const pkg = require( "../package.json" );

const buildUrl = account => {
	let url = "";
	if ( account.indexOf( "http://" ) !== 0 && account.indexOf( "https://" ) !== 0 ) {
		url = `https://${ account }`;
		// Assume leankit.com if no domain is specified
		if ( account.indexOf( "." ) === -1 ) {
			url += ".leankit.com";
		}
	} else {
		url = account;
	}
	if ( url.indexOf( "/", account.length - 1 ) !== 0 ) {
		url += "/";
	}
	return url;
};

const getUserAgent = () => {
	return `leankit-node-client/${ pkg.version }`;
};

const getPropertyValue = ( obj, prop, def = null ) => {
	for ( const k in obj ) {
		if ( k.toLowerCase() === prop.toLowerCase() ) {
			return obj[ k ];
		}
	}
	return def;
};


const removeProperties = ( obj, props ) => {
	for ( let i = 0; i < props.length; i++ ) {
		for ( const k in obj ) {
			if ( k.toLowerCase() === props[ i ].toLowerCase() ) {
				delete obj[ k ];
			}
		}
	}
};

const buildDefaultConfig = ( account, token, email, password, config ) => {
	config = config || { headers: {} };
	if ( !config.headers ) {
		config.headers = {};
	}
	const userAgent = getPropertyValue( config.headers, "User-Agent", getUserAgent() );
	removeProperties( config.headers, [ "User-Agent", "Content-Type", "Accept" ] );
	const proxy = config.proxy || null;
	const defaultHeaders = {
		Accept: "application/json",
		"Content-Type": "application/json",
		"User-Agent": userAgent
	};
	const headers = Object.assign( {}, config.headers, defaultHeaders );
	const auth = token ? { bearer: token } : { username: email, password };
	const defaults = {
		auth,
		baseUrl: buildUrl( account ),
		headers
	};

	if ( proxy ) {
		defaults.proxy = proxy;
	}
	return defaults;
};

const checkLegacyPath = urlPath => {
	return ( urlPath.startsWith( "api/" ) ) ? urlPath : `kanban/api/${ urlPath }`;
};

const mergeOptions = ( options, defaults ) => {
	if ( options.headers ) {
		options.headers.Accept = defaults.headers.Accept;
		options.headers[ "User-Agent" ] = defaults.headers[ "User-Agent" ];
	}
	const config = Object.assign( {}, defaults, options );
	if ( config.data ) {
		if ( config.headers[ "Content-Type" ] === "application/json" ) {
			config.body = JSON.stringify( config.data );
		} else {
			config.body = config.data;
		}
		delete config.data;
	}
	return config;
};

const parseBody = body => {
	let parsed;
	if ( typeof body === "string" && body !== "" ) {
		try {
			parsed = JSON.parse( body );
		} catch ( e ) {
			parsed = body;
		}
	} else {
		parsed = body;
	}
	return parsed;
};

const streamResponse = ( request, cfg, stream ) => {
	return new Promise( ( resolve, reject ) => {
		const response = {};
		request( cfg )
			.on( "error", err => {
				return reject( err );
			} )
			.on( "response", res => {
				response.status = res.statusCode;
				response.statusText = res.statusMessage;
				response.data = "";
			} )
			.on( "end", () => {
				if ( response.status < 200 || response.status >= 300 ) { // eslint-disable-line no-magic-numbers
					return reject( response );
				}
				return resolve( response );
			} )
			.pipe( stream );
	} );
};

const status = {
	status200: 200,
	status201: 201,
	status300: 300
};

module.exports = {
	buildUrl,
	buildDefaultConfig,
	getUserAgent,
	getPropertyValue,
	removeProperties,
	checkLegacyPath,
	parseBody,
	streamResponse,
	mergeOptions,
	status
};
