import path from "path";
import http from "http";
import dotenv from "dotenv";
import open from "open"
import {SpotifyClient} from "../src";

// load environment variables from .env in current directory
dotenv.config({
	path: path.resolve(__dirname, '.env')
});

describe("integration", () => {
	const client = new SpotifyClient({
		APIBaseURL: process.env.API_BASE_URL,
		authBaseURL: process.env.AUTH_BASE_URL,
		clientId: process.env.CLIENT_ID,
		redirectURL: "http://localhost:" + process.env.REDIRECT_SERVER_PORT,
		// Change these scopes if you don't feel comfortable reading that data about your account but make sure multiple scopes are present.
		// Hanving multiple scopes tests scope joining.
		scopes: ["user-follow-read", "user-library-read"],
		showDialog: false
	});

	it("gets an authorization code from Spotify", async () => {
		// allow time for the tester to complete OAuth dialog for first time
		const timeoutSeconds = 10;
		jest.setTimeout(timeoutSeconds * 1000);

		const url: string = await new Promise(resolve => {
			// start redirect server to recieve Spotify redirect request
			function listener(req: any, res: any) {
				res.end("Redirect complete.\nCheck test output\nYou can now close this window/tab.");
				redirectServer.close();
				resolve(req.url);
			}
			const redirectServer = http.createServer({}, listener);
			// log on server close because it takes a few seconds
			redirectServer.on("close", () => {
				process.stdout.write("Server closed (it's normal for this to take a few seconds)\n");
			});
			redirectServer.listen(process.env.REDIRECT_SERVER_PORT);

			// Make OAuth URL and open in browser.
			// This will redirect to the server above regardless of auth success.
			let u = client.makeOAuthURL("");
			process.stdout.write("Open the following link in you browser (if it does not open automatically) (you have " + timeoutSeconds + "s):\n" + u.href + "\n");
			open(u.href);
		});

		// test code
		const u = new URL(url, "http://localhost");
		// code is typically 211 chars long but it's not documented
		expect(u.searchParams.get("code")).toMatch(/^[\w\d-_]+$/);
	});
});
