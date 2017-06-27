/* eslint-disable max-lines */
const fs = require( "fs" );
const path = require( "path" );

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
	const pkgfilepath = path.resolve( __dirname, "../", "package.json" );
	if ( fs.existsSync( pkgfilepath ) ) {
		const pkg = JSON.parse( fs.readFileSync( pkgfilepath, "utf-8" ) );
		return `leankit-node-client/${ pkg.version }`;
	}
	return "leankit-node-client/2.0.0";
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
	getUserAgent,
	getPropertyValue,
	removeProperties,
	checkLegacyPath,
	parseBody,
	streamResponse,
	mergeOptions,
	status
};
