import * as imports from ".";
import {SpotifyClient} from "./SpotifyClient";
import {SpotifyUser} from "./SpotifyUser";

describe("index", () => {
	it("exports client", () => {
		expect(imports.SpotifyClient).toBe(SpotifyClient);
	});

	it("exports user", () => {
		expect(imports.SpotifyUser).toBe(SpotifyUser);
	});
});
