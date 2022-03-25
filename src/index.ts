interface SpotifyOptions {
	baseURL: string;
	clientId: string;
	redirectURL: string;
	scopes: string[];
	showDialog: boolean
}

export class Spotify {
	options: SpotifyOptions

	constructor(options: SpotifyOptions) {
		this.options = options;
	}

	// https://developer.spotify.com/documentation/general/guides/authorization/code-flow/#request-user-authorization
	makeOAuthURL(): URL {
		const u = new URL(this.options.baseURL);
		u.searchParams.set("client_id", this.options.clientId);
		u.searchParams.set("response_type", "code");
		u.searchParams.set("redirect_uri", this.options.redirectURL);
		u.searchParams.set("state", ""); // not sure how to handle this yet
		u.searchParams.set("scope", this.options.scopes.join(" "));
		u.searchParams.set("show_dialog", this.options.showDialog.toString());
		return u;
	}

	// Creates a user from auth code
	getUser(code: string): SpotifyUser {
		return new SpotifyUser()
	}
}

export class SpotifyUser {
	spotify: Spotify
	authCode: string
	accessToken: string
	accessTokenExpiryTime: Date
	refreshToken: string

	// Get this user's access token
	// https://developer.spotify.com/documentation/general/guides/authorization/code-flow/#request-access-token
	// requires authCode
	async getAccessToken(): Promise<void> {
	}

	// Refresh this users access token
	// https://developer.spotify.com/documentation/general/guides/authorization/code-flow/#request-a-refreshed-access-token
	async refreshAccessToken(): Promise<void> {
	}

	// make request to spotify api
	// This method handles rate limits
	async request() {
	}
}
