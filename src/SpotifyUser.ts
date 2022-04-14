import path from "path";
import {SpotifyClient, SpotifyRequestError, SpotifyResponse} from "./SpotifyClient";

export class SpotifyUser {
	client: SpotifyClient;
	accessToken: string;
	accessTokenExpiryDate: Date;
	refreshToken: string;
	grantedScopes: string[];

	// Refresh this users access token
	//https://developer.spotify.com/documentation/general/guides/authorization/code-flow/#request-a-refreshed-access-token
	async refreshAccessToken(): Promise<void> {
		// get refreshed access token from Spotify
		const url = new URL(this.client.config.authBaseURL);
		url.pathname = path.resolve(url.pathname, "api/token");

		const options = {
			method: "POST",
			headers: {
				authorization: "Basic " + Buffer.from(this.client.config.clientId + ":" + this.client.config.clientSecret).toString("base64"),
				"content-type": "application/x-www-form-urlencoded",
			},
		};

		const body = new URLSearchParams({
			grant_type: "refresh_token",
			refresh_token: this.refreshToken,
		}).toString();

		const response = await this.client._internalMakeRequest(url, options, body);

		if (response.statusCode !== 200) {
			throw new SpotifyRequestError("Failed to refresh access token for user", url.href, response);
		}

		// assign token etc to user
		this.accessToken = response.body.access_token;
		const d = new Date();
		d.setSeconds(d.getSeconds() + response.body.expires_in);
		this.accessTokenExpiryDate = d;
		this.grantedScopes = response.body.scope.split(" ");
	}

	// make request to spotify api
	// This method handles rate limits (not implemented yet) and access token refreshing.
	async makeRequest(endpoint: string, options: any, body: string): Promise<SpotifyResponse> {
		// concat endpoint with base url
		const url = new URL(this.client.config.APIBaseURL + endpoint);
		// add auth header
		if (!isObject(options)) {
			options = {};
		}
		if (!isObject(options.headers)) {
			options.headers = {};
		}
		options.headers.authorization = "Bearer " + this.accessToken;

		// make request
		let response = await this.client._internalMakeRequest(url, options, body);

		// retry if token has expired
		if (response.statusCode === 401) {
			await this.refreshAccessToken();
			options.headers.authorization = "Bearer " + this.accessToken;
			response = await this.client._internalMakeRequest(url, options, body);
		}

		if (response.statusCode >= 300) {
			throw new SpotifyRequestError("Failed to make request", url.href, response);
		}

		return response;
	}
}

// checks if value is an object and not null because JavaScript
function isObject(value: any) {
	return (value instanceof Object) && value != null
}
