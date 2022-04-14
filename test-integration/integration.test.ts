import path from "path";
import http from "http";
import dotenv from "dotenv";
import open from "open"
import {SpotifyClient, SpotifyUser, SpotifyResponse} from "../src";

// load environment variables from .env in current directory
dotenv.config({
	path: path.resolve(__dirname, '.env')
});

// patters to match auth code and tokens
const codeRegex = /^[\w-]+$/;
const tokenRegex = codeRegex;

const tokenKeys = ["accessToken", "refreshToken"];

describe("integration", () => {
	const client = new SpotifyClient({
		APIBaseURL: process.env.API_BASE_URL,
		authBaseURL: process.env.AUTH_BASE_URL,
		clientId: process.env.CLIENT_ID,
		clientSecret: process.env.CLIENT_SECRET,
	});

	// Change these scopes if you don't feel comfortable reading that data about your account but make sure multiple scopes are present.
	// Having multiple scopes tests scope joining.
	// "user-follow-read" and "user-library-read" should be granted without requesting additional scopes.
	const scopes = ["user-follow-read", "user-library-read"];
	const redirectURL = "http://localhost:" + process.env.REDIRECT_SERVER_PORT;

	// Execute full auth flow before any test executes because it must be executed in order.
	let authCode: string;
	let user: SpotifyUser;
	beforeAll(async () => {
		const authURL = client.getAuthorizationURL(redirectURL, scopes, "", false);
		authCode = await spotifyAuthorization(authURL);
		user = await client.getUser(authCode, redirectURL);
	});

	describe("SpotifyClient", () => {
		describe(".getAuthorizationURL", () => {
			it("creates a URL that gets an authorization code from Spotify", async () => {
				// Code is typically 211 chars long but it's not documented so just test
				// for length and characters.
				expect(authCode).toMatch(codeRegex);
			});
		});

		describe(".getUser", () => {
			// access and refresh token tests
			for (const tokenKey of tokenKeys) {
				it("gets a user with " + tokenKey, () => {
					expect(user[tokenKey]).toMatch(tokenRegex);
				});
			}

			it("gets access token expiry", () => {
				testAccessTokenExpiryDate(user.accessTokenExpiryDate, 5);
			});

			it("gets granted scopes", () => {
				// Spotify should grant the requested scopes. Change them if neccessary?
				expect(user.grantedScopes).toHaveLength(2);
			});
		});

		describe("SpotifyUser", () => {
			describe(".refreshAccessToken", () => {
				// create a new authed user so access token can be overridden without disturbing other async tests.
				const newUser = new SpotifyUser();
				beforeAll(async () => {
					newUser.client = user.client;
					newUser.refreshToken = user.refreshToken;
					await newUser.refreshAccessToken();
				});

				it("updates access token", async () => {
					expect(newUser.accessToken).toMatch(tokenRegex);
				});

				it("updates access token expiry date", () => {
					testAccessTokenExpiryDate(newUser.accessTokenExpiryDate, 5);
				});
			});

			describe(".makeRequest", () => {
				let response: SpotifyResponse;
				beforeAll(async () => {
					response = await user.makeRequest("/me", {}, "");
				});

				it("can get the users profile", async () => {
					expect(response.statusCode).toBe(200);
				});

				it("parses JSON responses", () => {
					expect(response.body.id).toMatch(/[\w]+/);
				});

				it("returns response that contains the http.IncomingMessage", () => {
					expect(response.incomingMessage).toBeInstanceOf(http.IncomingMessage);
					expect(response.incomingMessage.statusCode).toBe(response.statusCode);
				});

				it("refreshes token and retries request when receiving status code 401", async () => {
					const newUser = new SpotifyUser();
					// create a new authed user so access token can be overridden without disturbing other async tests.
					newUser.client = user.client;
					newUser.refreshToken = user.refreshToken;
					// Do not copy access token. This makes Spotify return 401.

					const response = await newUser.makeRequest("/me", {}, "");
					expect(response.statusCode).toBe(200);
				});
			})
		});
	});
});

// Get's Spotify authorization from the developer
async function spotifyAuthorization(spotifyURL: URL): Promise<string> {
	// allow time for the human to complete OAuth dialog for first time
	const timeoutSeconds = 10;
	jest.setTimeout(timeoutSeconds * 1000);

	// start http server and open link in browser
	const redirectURL: URL = await new Promise((resolve, reject) => {
		// start redirect server to recieve Spotify redirect request
		function listener(req: any, res: any) {
			res.end("Redirect complete.\nCheck test output.\nYou can now close this window/tab.");
			// Close the server.
			// This taking too long can cause jest to print the "A worker process has failed to exit gracefully".
			redirectServer.close();
			resolve(new URL(req.url, "http://host"));
		}
		const redirectServer = http.createServer({}, listener);
		redirectServer.on("error", reject);
		// log when server closes because it takes a few seconds.
		// This no longer works but it also seems to be much faster at closing so I'll leave it here for now.
		redirectServer.on("close", () => {
			process.stdout.write("Server closed (it's normal for this to take a few seconds)\n");
		});
		redirectServer.listen(process.env.REDIRECT_SERVER_PORT);

		// Open auth URL in browser.
		// Spotify will redirect the browser to the server above regardless of auth success.
		process.stdout.write("Open the following link in you browser (if it does not open automatically) (you have " + timeoutSeconds + "s):\n" + spotifyURL.href + "\n");
		open(spotifyURL.href);
	});

	return redirectURL.searchParams.get("code");
}

function testAccessTokenExpiryDate(actual: Date, offsetMins: number) {
	const minDate = new Date();
	// Spotify access tokens are currently valid for 1 hour.
	// The purpose of this test is only to ensure that the property is assigned to from spotifies.
	// The value that is assigned is tested in unit tests.
	minDate.setMinutes(minDate.getMinutes() + offsetMins);
	expect(actual.getTime()).toBeGreaterThan(minDate.getTime());
}
