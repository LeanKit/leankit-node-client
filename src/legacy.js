const utils = require( "./utils" );

const rejectError = ( error, response, data, reject ) => {
	const message = response ? response.statusMessage : error.message;
	const reqErr = new Error( message );
	reqErr.stack = error.stack;
	if ( response ) {
		reqErr.status = response.statusCode;
		reqErr.statusText = response.statusMessage;
	}
	reqErr.data = data;
	return reject( reqErr );
};

const rejectBadStatus = ( response, data, reject ) => {
	const err = new Error( response.statusText );
	err.name = "clientRequestError";
	err.replyCode = response.statusCode;
	err.data = data;
	return reject( err );
};

const rejectBadReplyCode = ( data, reject ) => {
	const err = new Error( data.ReplyText || "apiError" );
	err.name = "apiError";
	err.httpStatusCode = data.ReplyCode;
	err.replyCode = data.ReplyCode;
	err.replyText = data.ReplyText;
	err.replyData = data.ReplyData;
	return reject( err );
};

const parseReplyData = ( { error, response, body, resolve, reject } ) => {
	const parsed = utils.parseBody( body );
	if ( error ) {
		return rejectError( error, response, parsed, reject );
	}
	if ( response.statusCode !== utils.status.status200 ) {
		return rejectBadStatus( response, parsed, reject );
	}
	if ( parsed && parsed.ReplyCode && parsed.ReplyCode >= utils.status.status300 ) {
		return rejectBadReplyCode( parsed, reject );
	}
	if ( parsed && parsed.ReplyCode && parsed.ReplyCode !== utils.status.status200 && parsed.ReplyCode !== utils.status.status201 ) {
		return resolve( parsed );
	}
	if ( parsed.ReplyData && parsed.ReplyData.length > 0 ) {
		return resolve( {
			status: parsed.ReplyCode,
			statusText: parsed.ReplyText,
			data: parsed.ReplyData[ 0 ]
		} );
	}
	return resolve( parsed );
};

const handler = ( req, defaults ) => {
	const request = ( options, stream = null ) => {
		options.url = utils.checkLegacyPath( options.url );
		const cfg = utils.mergeOptions( options, defaults );
		if ( stream ) {
			return utils.streamResponse( req, cfg, stream );
		}
		return new Promise( ( resolve, reject ) => {
			req( cfg, ( err, res, body ) => {
				return parseReplyData( { error: err, response: res, body, resolve, reject } );
			} );
		} );
	};

	return { request };
};

module.exports = handler;
