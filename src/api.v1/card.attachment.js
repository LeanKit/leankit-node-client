module.exports = ( api, request ) => {
	api.card.attachment = {};

	api.card.attachment.count = ( boardId, cardId ) => {
		return request( { url: `card/GetAttachmentsCount/${ boardId }/${ cardId }` } );
	};

	api.card.attachment.list = ( boardId, cardId ) => {
		return request( { url: `card/GetAttachments/${ boardId }/${ cardId }` } );
	};

	api.card.attachment.get = ( boardId, cardId, attachmentId ) => {
		return request( { url: `card/GetAttachments/${ boardId }/${ cardId }/${ attachmentId }` } );
	};

	api.card.attachment.create = ( boardId, cardId, { name, description, file } ) => {
		const formData = {
			Id: 0,
			File: file,
			Description: description,
			FileName: name
		};
		return request( {
			url: `card/SaveAttachment/${ boardId }/${ cardId }`,
			method: "POST",
			formData
		} );
	};

	api.card.attachment.download = ( boardId, attachmentId, stream ) => {
		return request( {
			url: `card/DownloadAttachment/${ boardId }/${ attachmentId }`
		}, stream );
	};

	api.card.attachment.destroy = ( boardId, cardId, attachmentId ) => {
		return request( {
			url: `card/DeleteAttachment/${ boardId }/${ cardId }/${ attachmentId }`,
			method: "POST"
		} );
	};
};
