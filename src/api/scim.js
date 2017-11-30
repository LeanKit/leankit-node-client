module.exports = ( api, request ) => {
	api.scim = { user: {} };
	api.user.list = ( params = {} ) => {
		return request( {
			url: "/io/scim/v1/users",
			method: "get",
			qs: params
		} );
	};

	api.user.create = userCreateRequest => {
		return request( {
			url: "/io/scim/v1/users",
			method: "post",
			data: userCreateRequest
		} );
	};

	api.user.update = userUpdateRequest => {
		return request( {
			url: `/io/scim/v1/users/${ userUpdateRequest.id }`,
			method: "patch",
			data: userUpdateRequest
		} );
	};

	api.user.replace = userUpdateRequest => {
		return request( {
			url: `/io/scim/v1/users/${ userUpdateRequest.id }`,
			method: "put",
			data: userUpdateRequest
		} );
	};

	api.user.destroy = userId => {
		return request( {
			url: `/io/scim/v1/users/${ userId }`,
			method: "delete"
		} );
	};
};
