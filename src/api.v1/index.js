const board = require( "./board" );
const card = require( "./card" );
const cardComment = require( "./card.comment" );
const cardAttachment = require( "./card.attachment" );
const task = require( "./task" );

module.exports = ( api, request ) => {
	api.v1 = {};
	board( api.v1, request );
	card( api.v1, request );
	cardAttachment( api.v1, request );
	cardComment( api.v1, request );
	task( api.v1, request );
};
