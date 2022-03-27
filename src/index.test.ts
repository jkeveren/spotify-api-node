import * as index from ".";
import {SpotifyClient, SpotifyRequestError} from "./SpotifyClient";
import {SpotifyUser} from "./SpotifyUser";

describe("index", () => {
	it("exports client", () => {
		expect(index.SpotifyClient).toBe(SpotifyClient);
	});

	it("exports user", () => {
		expect(index.SpotifyUser).toBe(SpotifyUser);
	});

	it("exports errors", () => {
		expect(index.SpotifyRequestError).toBe(SpotifyRequestError);
	});
});
