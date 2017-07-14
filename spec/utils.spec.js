const utils = require( "../src/utils" );

describe( "utils tests", () => {
	describe( "buildUrl", () => {
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
	});

	describe( "buildDefaultConfig", ()=> {
		let result;
		describe( "when providing account and token", ()=> {
			before(() => {
				result = utils.buildDefaultConfig( "bob", "1234" );
			});
			it( "should have expanded url", ()=> {
				result.baseUrl.should.equal( "https://bob.leankit.com/" );
			} );
			it( "should use bearer token auth with specified token", ()=> {
				result.auth.should.eql( { bearer: "1234" } );
			} );
			it( "should have default headers", ()=> {
				result.headers.should.eql({
					Accept: "application/json",
					"Content-Type": "application/json",
					"User-Agent": utils.getUserAgent()
				} );
			} );
		} );
		describe( "when providing email and password", () => {
			before(() => {
				result = utils.buildDefaultConfig( "bob", null, "wcoyote@acme.com", "rr!#@" );
			});
			it( "should use provided credentials", ()=> {
				result.auth.should.eql({
					username: "wcoyote@acme.com",
					password: "rr!#@"
				});
			} );
		})
		describe( "when providing token plus email and password", () => {
			before(() => {
				result = utils.buildDefaultConfig( "bob", "1234", "wcoyote@acme.com", "rr!#@" );
			});
			it( "should use bearer token auth with specified token", ()=> {
				result.auth.should.eql( { bearer: "1234" } );
			} );
		})
		describe( "when providing header values in config", ()=> {
			it( "should force values for Accept, Content-Type, and User-Agent", ()=> {
				let invalidHeaders = {
					Accept: "anything",
					"Content-Type": "text/css",
					"User-Agent": "Mozilla/5.0"
				}
				result = utils.buildDefaultConfig( "bob", "1234", null, null, { config: { headers: invalidHeaders } } );
				result.headers.should.eql({
					Accept: "application/json",
					"Content-Type": "application/json",
					"User-Agent": utils.getUserAgent()
				} );
			} );
		} );
		describe( "when providing other header values in config", ()=> {
			it( "should include the header values", ()=> {
				let headers = {
					CustomHeader:"beardzrock"
				};
				result = utils.buildDefaultConfig( "bob", "1234", null, null, { headers } );
				result.headers.should.eql({
					Accept: "application/json",
					"Content-Type": "application/json",
					"User-Agent": utils.getUserAgent(),
					CustomHeader: "beardzrock"
				} );

			} );
		} );
		describe( "when providing a proxy value", ()=> {
			it( "should include the proxy", ()=> {
				let config = {
					proxy:{
					}
				}
				result = utils.buildDefaultConfig( "bob", "1234", null, null, config );
				result.proxy.should.eql({});
			} );
		} );
	} );
} );
