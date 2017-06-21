const board = require( "./board" );
const card = require( "./card" );
const cardComment = require( "./card.comment" );

module.exports = ( api, request, { accountName, email, password } ) => {
	api.v1 = {};
	board( api.v1, request );
	card( api.v1, request );
	cardComment( api.v1, request );
};
