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
				authorization: "Basic " + btoa(this.client.config.clientId + ":" + this.client.config.clientSecret),
				"content-type": "application/x-www-form-urlencoded",
			},
		};

		const body = new URLSearchParams({
			grant_type: "refresh_token",
			refresh_token: this.refreshToken,
		}).toString();

		const response = await this.client._internalMakeRequest(url, options, body);

		if (response.statusCode !== 200) {
			throw new SpotifyRequestError("Failed to refresh access token for user", response);
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

		// for loop enables retry of request once token is refreshed
		for (let i = 0; i < 2; i++) {
			switch (response.statusCode) {
				case 200:
					break;
				case 401:
					// if first 401, refresh access token and retry
					if (i === 0) {
						await this.refreshAccessToken();
						options.headers.authorization = "Bearer " + this.accessToken;
						response = await this.client._internalMakeRequest(url, options, body);
						break;
					}
					// otherwise fall through to error
				default:
					throw new SpotifyRequestError("Failed to make request", response);
			}
		}

		return response;
	}
}

// checks if value is an object and not null because JavaScript
function isObject(value: any) {
	return (value instanceof Object) && value != null
}
