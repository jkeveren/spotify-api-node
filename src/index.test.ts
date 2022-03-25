import { Spotify } from ".";

describe("Spotify", () => {
	// Create a Spotify
	const config = {
		baseURL: "https://mock.base/URL",
		clientId: "mock-client-id",
		redirectURL: "https://mock.redirect/URL",
		scopes: ["mock-scope-1", "mock-scope-2"],
		showDialog: false,
	}
	const s = new Spotify(config);

	describe(".makeOAuthURL", () => {
		const u: URL = s.makeOAuthURL();

		// Base URL
		it("returns correct base URL", () => {
			expect(u.href.indexOf(config.baseURL)).toBe(0);
		});

		// Querystring Parameters
		const parameters = {
			client_id: config.clientId,
			response_type: "code",
			redirect_uri: config.redirectURL,
			state: "",
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
