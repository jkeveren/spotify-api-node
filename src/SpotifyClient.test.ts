import http from "http";
import {SpotifyClient, SpotifyResponse, RequestError} from "./SpotifyClient";
import {SpotifyUser} from "./SpotifyUser";

describe("SpotifyClient", () => {
	// Create a Spotify
	const config = {
		authBaseURL: "https://mock.auth.base/URL",
		APIBaseURL: "https://mock.API.base/URL",
		clientId: "mock-client-id",
		clientSecret: "mock-client-secret",
		redirectURL: "https://mock.redirect/URL",
		scopes: ["mock-scope-1", "mock-scope-2"],
		showDialog: false,
	}
	const client = new SpotifyClient(config);

	describe(".makeOAuthURL", () => {
		const state = "mock-state"
		const u: URL = client.makeOAuthURL(state);

		// Base URL
		it("returns correct base URL", () => {
			expect(u.href).toMatch(new RegExp("^" + config.authBaseURL + "/authorize"));
		});

		// Querystring Parameters
		const params = {
			client_id: config.clientId,
			response_type: "code",
			redirect_uri: config.redirectURL,
			state: state,
			scope: config.scopes.join(" "),
			show_dialog: config.showDialog.toString(),
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

		let requestURL: URL;
		let requestOptions: any;
		let requestBody: string;

		client._internalMakeRequest = async (url: URL, options: object, body: string) => {
			requestURL = url;
			requestOptions = options;
			requestBody = body;

			const response = {
				statusCode: 200,
				body: {
					access_token: mockTokens.accessToken,
					token_type: "Bearer",
					scope: config.scopes.join(" "),
					expires_in: 100,
					refresh_token: mockTokens.refreshToken,
				}
			};
			return response
		}

		beforeAll(async () => {
			user = await client.getUser(mockAuthCode);
		});

		describe("internal requester usage", () => {
			it("requests the correct base URL and path", () => {
				expect(requestURL.href).toMatch(new RegExp("^" + config.authBaseURL + "/api/token"));
			});

			it("requests with correct body", () => {
				const want = new URLSearchParams({
					grant_type: "authorization_code",
					code: mockAuthCode,
					redirect_uri: config.redirectURL
				});
				const got = new URLSearchParams(requestBody);
				want.sort();
				got.sort();
				expect(got.toString()).toEqual(want.toString());
			});

			it("uses the correct method", () => {
				expect(requestOptions.method.toLowerCase()).toBe("post");
			});

			it("sends correct Authorization header", () => {
				expect(requestOptions.headers["Authorization"]).toBe("Basic " + btoa(config.clientId + ":" + config.clientSecret));
			});

			it("sends correct content-type header", () => {
				expect(requestOptions.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
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
			const d = new Date();
			d.setSeconds(d.getSeconds() + 100);
			// This a not great way of testing that the dates are very close.
			// I can't think of a better way of doing this right now but this does work.
			expect(user.accessTokenExpiryDate.getTime() / 100).toBeCloseTo(d.getTime() / 100, 0);
		});

		it("returns a user with correct scopes", () => {
			expect(user.scopes).toEqual(config.scopes);
		});

		it("throws if fails to get tokens", () => {
			const client = new SpotifyClient(config);
			client._internalMakeRequest = async (url: URL, options: object, body: string) => {
				return {
					statusCode: 400,
					body: ""
				};
			}
			expect(async () => {
				await client.getUser(mockAuthCode);
			}).rejects.toThrow(RequestError);
		});
	});
});
