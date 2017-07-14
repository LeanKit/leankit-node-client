var repl = require( "repl" );
var package = require( "./package.json" );
global.lk= require( "./src" );

global.dump = function( str ) {
	console.log( JSON.stringify( str, null, 2 ) );
};

console.log( package.name + " v" + package.version );

repl.start( {
	prompt: "lk > ",
	ignoreUndefined: true,
	useGlobal: true
} );
