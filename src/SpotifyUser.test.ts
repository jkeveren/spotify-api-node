import {SpotifyUser} from "./SpotifyUser";
import {SpotifyClient, SpotifyResponse, RequestError} from "./SpotifyClient";
import {testNumberRange} from "./testFunctions";

describe("SpotifyUser", () => {
	// create user with relevant properties
	const user = new SpotifyUser();

	// user's tokens
	// Store tokens in seperate variables for immutablility and iteration
	const mockTokens = {
		refreshToken: "mock-refresh-token",
		accessToken: "mock-access-token",
	};
	// assign mock tokens to user
	for (const [key, value] of Object.entries(mockTokens)) {
		user[key] = value;
	}

	// user's client
	const clientConfig = {
		authBaseURL: "https://mock.auth.base/URL",
		APIBaseURL: "",
		clientId: "mock-client-id",
		clientSecret: "mock-client-secret",
		redirectURL: "",
		scopes: [],
		showDialog: false,
	}
	user.client = new SpotifyClient(clientConfig);

	const mockExpiresIn = 100;
	const mockGrantedScopes = ["mock-scope-1", "mock-scope-2"];

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
				access_token: mockTokens.accessToken,
				token_type: "Bearer",
				scope: mockGrantedScopes.join(" "),
				expires_in: mockExpiresIn,
			}
		}
	};

	describe(".refreshAccessToken", () => {
		beforeAll(async () => {
			// remove original token because new token will be the same
			user.accessToken = "";
			user.accessTokenExpiryDate = new Date();
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
			expect(user.accessToken).toBe(mockTokens.accessToken);
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
			user.client._internalMakeRequest = async (url: URL, options: object, body: string) => {
				return {
					statusCode: 400,
					body: {},
				};
			};
			expect(async () => {
				await user.refreshAccessToken();
			}).rejects.toThrow(RequestError);
		});
	});
});
