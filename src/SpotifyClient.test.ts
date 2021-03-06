import http from "http";
import {SpotifyClient, SpotifyResponse, SpotifyRequestError} from "./SpotifyClient";
import {SpotifyUser} from "./SpotifyUser";

describe("SpotifyClient", () => {
	// Create a Spotify
	const config = {
		authBaseURL: "https://mock.auth.base/URL",
		APIBaseURL: "https://mock.API.base/URL",
		clientId: "mock-client-id",
		clientSecret: "mock-client-secret",
	}
	const client = new SpotifyClient(config);

	const mockRedirectURL = "https://mock.redirect/URL";
	const mockScopes = ["mock-scope-1", "mock-scope-2"];
	const mockShowDialog = false;
	const mockState = "mock-state"

	describe(".getAuthorizationURL", () => {
		const u: URL = client.getAuthorizationURL(mockRedirectURL, mockScopes, mockState, mockShowDialog);

		// Base URL
		it("returns correct base URL", () => {
			expect(u.href).toMatch(new RegExp("^" + config.authBaseURL + "/authorize"));
		});

		// Querystring Parameters
		const params = {
			client_id: config.clientId,
			response_type: "code",
			redirect_uri: mockRedirectURL,
			state: mockState,
			scope: mockScopes.join(" "),
			show_dialog: mockShowDialog.toString(),
		};
		for (const [key, value] of Object.entries(params)) {
			it("returns correct search parameter " + key, () => {
				expect(u.searchParams.get(key)).toBe(value);
			})
		}
	});

	describe(".getUser", () => {
		let user: SpotifyUser;

		const mockTokens = {
			accessToken: "mock-access-token",
			refreshToken: "mock-refresh-token"
		}
		const mockAuthCode = "mock-authorization-code";
		const mockExpiresIn = 100;

		// internal requester
		let requested = false;
		let requestURL: URL;
		let requestOptions: any;
		let requestBody: string;
		// using different scopes in the reponse ensures that the client gets the scopes from the response and not from configuration.
		const responseScopes = ["mock-scope-3", "mock-scope-4"];
		client._internalMakeRequest = async (url: URL, options: any, body: string) => {
			requested = true;
			requestURL = url;
			requestOptions = options;
			requestBody = body;


			const response = {
				statusCode: 200,
				body: {
					access_token: mockTokens.accessToken,
					token_type: "Bearer",
					scope: responseScopes.join(" "),
					expires_in: mockExpiresIn,
					refresh_token: mockTokens.refreshToken,
				},
				incomingMessage: new http.IncomingMessage(null),
			};
			return response
		}

		beforeAll(async () => {
			user = await client.getUser(mockAuthCode, mockRedirectURL);
		});

		describe("internal requester usage", () => {
			it("uses the internal requester", () => {
				expect(requested).toBe(true);
			});

			it("uses correct url", () => {
				expect(requestURL.href).toBe(config.authBaseURL + "/api/token");
			});

			it("uses correct method", () => {
				expect(requestOptions.method.toLowerCase()).toBe("post");
			});

			it("uses correct Authorization header", () => {
				expect(requestOptions.headers["authorization"]).toBe("Basic " + Buffer.from(config.clientId + ":" + config.clientSecret).toString("base64"));
			});

			it("uses correct content-type header", () => {
				expect(requestOptions.headers["content-type"]).toBe("application/x-www-form-urlencoded");
			});

			it("uses correct body", () => {
				const want = new URLSearchParams({
					grant_type: "authorization_code",
					code: mockAuthCode,
					redirect_uri: mockRedirectURL
				});
				const got = new URLSearchParams(requestBody);
				want.sort();
				got.sort();
				expect(got.toString()).toEqual(want.toString());
			});
		});

		it("returns a user with correct client", () => {
			expect(user.client).toBe(client);
		});

		for (const [key, value] of Object.entries(mockTokens)) {
			it("returns a user with correct " + key, () => {
				expect(user[key]).toBe(value);
			});
		}

		it("returns a user with correct token expiry", () => {
			const expectedTime = Date.now() + mockExpiresIn * 1000 // miliseconds
			const allowedDeviation = 100; // millieconds
			global.testNumberRange(user.accessTokenExpiryDate.getTime(), expectedTime, allowedDeviation);
		});

		it("returns a user with correct scopes", () => {
			expect(user.grantedScopes).toEqual(responseScopes);
		});

		it("throws if fails to get tokens", () => {
			const client = new SpotifyClient(config);
			client._internalMakeRequest = async (url: URL, options: any, body: string) => {
				return {
					statusCode: 400,
					body: "",
					incomingMessage: new http.IncomingMessage(null),
				};
			}
			expect(async () => {
				await client.getUser(mockAuthCode, mockRedirectURL);
			}).rejects.toThrow(SpotifyRequestError);
		});
	});
});
