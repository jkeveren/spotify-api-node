import http from "http";
import {SpotifyUser} from "./SpotifyUser";
import {SpotifyClient, SpotifyResponse, SpotifyRequestError} from "./SpotifyClient";
import {testNumberRange} from "./testFunctions";

describe("SpotifyUser", () => {
	// user's tokens
	const mockRefreshToken = "mock-refresh-token";
	const mockAccessToken = "mock-access-token";

	// user's client
	const clientConfig = {
		authBaseURL: "https://mock.auth.base/URL",
		APIBaseURL: "https://mock.API.base/URL",
		clientId: "mock-client-id",
		clientSecret: "mock-client-secret",
		redirectURL: "",
		scopes: [],
		showDialog: false,
	}

	const mockExpiresIn = 100;
	const mockGrantedScopes = ["mock-scope-1", "mock-scope-2"];

	describe(".refreshAccessToken", () => {
		const user = new SpotifyUser;
		user.client = new SpotifyClient(clientConfig);
		user.refreshToken = mockRefreshToken;

		// internal requester
		let requested = false;
		let requestURL: URL;
		let requestOptions: any;
		let requestBody: string;
		user.client._internalMakeRequest = async (url: URL, options: any, body: string) => {
			requested = true;
			requestURL = url;
			requestOptions = options;
			requestBody = body;

			return {
				statusCode: 200,
				body: {
					access_token: mockAccessToken,
					token_type: "Bearer",
					scope: mockGrantedScopes.join(" "),
					expires_in: mockExpiresIn,
				},
				incomingMessage: new http.IncomingMessage(null),
			}
		};

		beforeAll(async () => {
			await user.refreshAccessToken();
		});

		describe("internal requester usage", () => {
			it("uses the internal requester", () => {
				expect(requested).toBe(true);
			});

			it("uses correct url", () => {
				expect(requestURL.href).toBe(clientConfig.authBaseURL + "/api/token");
			});

			it("uses correct method", () => {
				expect(requestOptions.method.toLowerCase()).toBe("post");
			});

			it("uses correct authorization header", () => {
				expect(requestOptions.headers["authorization"]).toBe("Basic " + btoa(clientConfig.clientId + ":" + clientConfig.clientSecret));
			});

			it("uses correct content-type header", () => {
				expect(requestOptions.headers["content-type"]).toBe("application/x-www-form-urlencoded");
			});

			it("uses correct body", () => {
				const want = new URLSearchParams({
					grant_type: "refresh_token",
					refresh_token: user.refreshToken,
				});
				const got = new URLSearchParams(requestBody);
				want.sort();
				got.sort();
				expect(got.toString()).toBe(want.toString());
			});
		});

		it("updates access token", () => {
			expect(user.accessToken).toBe(mockAccessToken);
		});

		it("updates access token expiry date", () => {
			const expectedTime = Date.now() + mockExpiresIn * 1000 // miliseconds
			const allowedDeviation = 100; // millieconds
			testNumberRange(expect, user.accessTokenExpiryDate.getTime(), expectedTime, allowedDeviation);
		});

		it("updates granted scopes", () => {
			expect(user.grantedScopes).toEqual(mockGrantedScopes);
		});

		it("throws on request failure", () => {
			const originalRequester = user.client._internalMakeRequest;
			user.client._internalMakeRequest = async (url: URL, options: any, body: string) => {
				return {
					statusCode: 400,
					body: {},
					incomingMessage: new http.IncomingMessage(null),
				};
			};
			expect(async () => {
				await user.refreshAccessToken();
			}).rejects.toThrow(SpotifyRequestError);
		});
	});

	describe(".makeRequest", () => {
		const user = new SpotifyUser();
		user.refreshToken = mockRefreshToken;
		user.client = new SpotifyClient(clientConfig);

		const mockPath = "/pa/th?search=params#fragment";
		const mockURL = new URL(clientConfig.APIBaseURL + mockPath);
		const mockOptions = {
			method: "mock-method",
			// headers are not included to ensure that headers object is added allong with auth header
		};
		const mockBody = "mock-body";
		const mockResponse = {
			statusCode: 200,
			body: "mock-body",
			incomingMessage: new http.IncomingMessage(null),
		};

		// internal requester
		let requested = false;
		let requestURL: URL;
		let requestOptions: any;
		let requestBody: string;
		user.client._internalMakeRequest = async (url: URL, options: any, body: string) => {
			requested = true;
			requestURL = url;
			requestOptions = options;
			requestBody = body;

			return mockResponse
		};

		let actualResponse: SpotifyResponse;
		beforeAll(async () => {
			actualResponse = await user.makeRequest(mockPath, mockOptions, mockBody);
		});

		describe("internal requester usage", () => {
			it("uses the internal requester", () => {
				expect(requested).toBe(true);
			});

			it("uses correct url", () => {
				expect(requestURL.href).toBe(mockURL.href);
			});

			it("uses correct method", () => {
				expect(requestOptions).toBe(mockOptions);
			});

			it("uses correct body", () => {
				expect(requestBody).toBe(mockBody);
			});

			it("uses correct authorization header", () => {
				expect(requestOptions.headers["authorization"]).toBe("Bearer " + user.accessToken);
			});
		});

		it("returns correct response", () => {
			expect(actualResponse).toBe(mockResponse)
		});

		it("throws on request failure", () => {
			const originalRequester = user.client._internalMakeRequest;
			user.client._internalMakeRequest = async (url: URL, options: any, body: string) => {
				return {
					statusCode: 400,
					body: null,
					incomingMessage: new http.IncomingMessage(null),
				};
			};
			expect(async () => {
				await user.makeRequest("/", null, null);
			}).rejects.toThrow(SpotifyRequestError);
		});
	});
});
