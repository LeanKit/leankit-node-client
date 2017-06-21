module.exports = ( api, request, { accountName, email, password } ) => {
	api.reporting = { auth: {}, export: {} };

	const joinconfig = ( token, config = {} ) => {
		const p = Object.assign( {}, config );
		p.token = token;
		return p;
	};

	const exec = ( { token, stream, config, path } ) => {
		const qs = joinconfig( token, config );
		if ( !stream ) {
			qs.format = "json";
		}
		return request( {
			url: `/io/reporting/export/${ path }`,
			method: "GET",
			qs
		}, stream );
	};

	api.reporting.auth.token = () => {
		return request( {
			url: "/io/reporting/auth",
			method: "POST",
			data: {
				email,
				password,
				accountName
			}
		} );
	};

	api.reporting.export.cards = ( { token, stream, config } ) => {
		return exec( { token, stream, config, path: "cards" } );
	};

	api.reporting.export.cardpositions = ( { token, stream, config } ) => {
		return exec( { token, stream, config, path: "cardpositions" } );
	};

	api.reporting.export.userassignments = ( { token, stream, config } ) => {
		return exec( { token, stream, config, path: "userassignments/current" } );
	};

	api.reporting.export.userassignments.history = ( { token, stream, config } ) => {
		return exec( { token, stream, config, path: "userassignments/history" } );
	};

	api.reporting.export.lanes = ( { token, stream, config } ) => {
		return exec( { token, stream, config, path: "lanes" } );
	};

	api.reporting.export.tags = ( { token, stream, config } ) => {
		return exec( { token, stream, config, path: "tags" } );
	};
};
