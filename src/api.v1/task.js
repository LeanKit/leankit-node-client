module.exports = ( api, request ) => {
	const defaultWipOverrideReason = "WIP Override performed by external system";
	const defaultPosition = 9999;
	api.task = { board: {} };

	api.task.board.get = ( boardId, cardId ) => {
		return request( { url: `v1/board/${ boardId }/card/${ cardId }/taskboard` } );
	};
	api.task.board.since = {};
	api.task.board.since.version = ( boardId, cardId, version ) => {
		return request( { url: `v1/board/${ boardId }/card/${ cardId }/tasks/boardversion/${ version }` } );
	};

	api.task.create = ( boardId, cardId, taskCardObject, laneId = 0, position = defaultPosition, wipOverrideReason = defaultWipOverrideReason ) => { // eslint-disable-line max-params
		taskCardObject.UserWipOverrideComment = wipOverrideReason;
		return request( {
			url: `v1/board/${ boardId }/card/${ cardId }/tasks/lane/${ laneId }/position/${ position }`,
			method: "POST",
			data: taskCardObject
		} );
	};

	api.task.update = ( boardId, cardId, taskCardObject, wipOverrideReason = defaultWipOverrideReason ) => {
		taskCardObject.UserWipOverrideComment = wipOverrideReason;
		return request( {
			url: `v1/board/${ boardId }/update/card/${ cardId }/tasks/${ taskCardObject.Id }`,
			method: "POST",
			data: taskCardObject
		} );
	};

	api.task.move = ( boardId, cardId, taskId, toLaneId, position = defaultPosition ) => { // eslint-disable-line max-params
		return request( {
			url: `v1/board/${ boardId }/move/card/${ cardId }/tasks/${ taskId }/lane/${ toLaneId }/position/${ position }`,
			method: "POST"
		} );
	};

	api.task.destroy = ( boardId, cardId, taskId ) => {
		return request( {
			url: `v1/board/${ boardId }/delete/card/${ cardId }/tasks/${ taskId }`,
			method: "POST"
		} );
	};
};
