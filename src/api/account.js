module.exports = ( api, request ) => {
	api.account = {};
	api.account.get = () => {
		return request( { url: "/io/account", method: "get" } );
	};
	api.account.me = api.account.get;
};
