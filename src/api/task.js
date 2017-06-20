module.exports = ( api, request ) => {
	api.task = {};

	api.task.create = ( cardId, taskCreateRequest ) => {
		taskCreateRequest.cardId = cardId;
		if ( !taskCreateRequest.laneType && !taskCreateRequest.laneTitle ) {
			taskCreateRequest.laneTitle = "todo";
		}
		return request( {
			url: `/io/card/${ cardId }/tasks`,
			method: "POST",
			data: taskCreateRequest
		} );
	};

	api.task.get = ( cardId, taskId ) => {
		return request( {
			url: `/io/card/${ cardId }/tasks/${ taskId }`,
			method: "GET"
		} );
	};
};
