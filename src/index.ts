// config for Spotify constructor
interface SpotifyConfig {
	baseURL: string;
	clientId: string;
	redirectURL: string;
	scopes: string[];
	showDialog: boolean
}

export class Spotify {
	config: SpotifyConfig

	_requester: Function

	constructor(config: SpotifyConfig) {
		this.config = config;
		// this._requester = http | https
	}

	// https://developer.spotify.com/documentation/general/guides/authorization/code-flow/#request-user-authorization
	makeOAuthURL(): URL {
		const u = new URL(this.config.baseURL);
		u.searchParams.set("client_id", this.config.clientId);
		u.searchParams.set("response_type", "code");
		u.searchParams.set("redirect_uri", this.config.redirectURL);
		u.searchParams.set("state", ""); // not sure how to handle this yet
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

export class SpotifyUser {
	spotify: Spotify
	accessToken: string
	accessTokenExpiryTime: Date
	refreshToken: string

	// internal request function to use
	// mutable for mocking
	_requester: Function

	constructor() {
		// this._requester = http | https
	}

	// Refresh this users access token
	async refreshAccessToken(): Promise<void> {
		//make refresh request
		//https://developer.spotify.com/documentation/general/guides/authorization/code-flow/#request-a-refreshed-access-token
	}

	// make request to spotify api
	// This method handles rate limits and access token refreshing.
	async request() {
		// get refresh token if neccessary
		// make request
		// this.requester()
	}
}
