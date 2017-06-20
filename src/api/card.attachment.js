module.exports = ( api, request ) => {
	if ( !api.card ) {
		api.card = { attachment: {}, comment: {} };
	}

	api.card.attachment.list = cardId => {
		return request( {
			url: `/io/card/${ cardId }/attachment`,
			method: "GET"
		} );
	};

	api.card.attachment.create = ( cardId, { name, description, file } ) => {
		const formData = {
			Id: 0,
			File: file,
			Description: description,
			FileName: name
		};
		return request( {
			url: `/io/card/${ cardId }/attachment`,
			method: "POST",
			formData
		} );
	};

	api.card.attachment.content = ( cardId, attachmentId ) => {
		return request( {
			url: `/io/card/${ cardId }/attachment/${ attachmentId }/content`,
			method: "GET"
		} );
	};

	api.card.attachment.destroy = ( cardId, attachmentId ) => {
		return request( {
			url: `/io/card/${ cardId }/attachment/${ attachmentId }`,
			method: "DELETE"
		} );
	};
};
