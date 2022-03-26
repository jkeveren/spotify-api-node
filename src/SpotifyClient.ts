import {SpotifyUser} from "./SpotifyUser";

// config for Spotify constructor
interface SpotifyConfig {
	authBaseURL: string;
	APIBaseURL: string;
	clientId: string;
	redirectURL: string;
	scopes: string[];
	showDialog: boolean
}

export class SpotifyClient {
	config: SpotifyConfig

	// internal request function
	// mutable for mocking
	_makeRequest: Function

	constructor(config: SpotifyConfig) {
		this.config = config;
		// this._makeRequest = http | https
	}

	// https://developer.spotify.com/documentation/general/guides/authorization/code-flow/#request-user-authorization
	makeOAuthURL(state: string): URL {
		const u = new URL(this.config.authBaseURL + "/authorize");
		u.searchParams.set("client_id", this.config.clientId);
		u.searchParams.set("response_type", "code");
		u.searchParams.set("redirect_uri", this.config.redirectURL);
		u.searchParams.set("state", state);
		u.searchParams.set("scope", this.config.scopes.join(" "));
		u.searchParams.set("show_dialog", this.config.showDialog.toString());
		return u;
	}

	// Creates a user from auth code
	async getUser(code: string): Promise<SpotifyUser> {
		// make request to get refresh token and initial access token
		// https://developer.spotify.com/documentation/general/guides/authorization/code-flow/#request-access-token
		// construct and return SpotifyUser
		return new SpotifyUser()
	}
}
