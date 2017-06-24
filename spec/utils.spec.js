const utils = require( "../src/utils" );

describe( "utils tests", () => {
	it( "should turn an account name into a LeanKit URL", done => {
		const url = utils.buildUrl( "test" );
		url.should.equal( "https://test.leankit.com/" );
		done();
	} );

	it( "should preserve given URL", done => {
		const url = utils.buildUrl( "http://test.com" );
		url.should.equal( "http://test.com/" );
		done();
	} );
} );
