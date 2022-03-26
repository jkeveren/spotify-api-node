import path from "path";
import {SpotifyClient} from "./SpotifyClient";

describe("Spotify", () => {
	// Create a Spotify
	const config = {
		authBaseURL: "https://mock.auth.base/URL",
		APIBaseURL: "https://mock.API.base/URL",
		clientId: "mock-client-id",
		redirectURL: "https://mock.redirect/URL",
		scopes: ["mock-scope-1", "mock-scope-2"],
		showDialog: false,
	}
	const s = new SpotifyClient(config);

	describe(".makeOAuthURL", () => {
		const state = "mock-state"
		const u: URL = s.makeOAuthURL(state);

		// Base URL
		it("returns correct base URL", () => {
			expect(u.href).toMatch(new RegExp("^" + config.authBaseURL + "/authorize"));
		});

		// Querystring Parameters
		const parameters = {
			client_id: config.clientId,
			response_type: "code",
			redirect_uri: config.redirectURL,
			state: state,
			scope: config.scopes.join(" "),
			show_dialog: config.showDialog.toString(),
		};
		for (const [key, value] of Object.entries(parameters)) {
			it("returns correct search parameter " + key, () => {
				expect(u.searchParams.get(key)).toBe(value);
			})
		}
	});
});
