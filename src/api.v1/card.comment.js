module.exports = ( api, request ) => {
	api.card.comment = {};

	api.card.comment.list = ( boardId, cardId ) => {
		return request( { url: `card/getcomments/${ boardId }/${ cardId }` } );
	};

	api.card.comment.create = ( boardId, cardId, userId, comment ) => {
		return request( {
			url: `card/savecomment/${ boardId }/${ cardId }`,
			method: "POST",
			data: {
				PostedById: userId,
				Text: comment
			}
		} );
	};

	api.card.comment.create.by = {};
	api.card.comment.create.by.externalId = ( boardId, externalCardId, userId, comment ) => {
		return request( {
			url: `card/savecommentbyexternalid/${ boardId }/${ encodeURIComponent( externalCardId ) }`,
			method: "POST",
			data: {
				PostedById: userId,
				Text: comment
			}
		} );
	};
};
