import path from "path";
import {SpotifyClient, RequestError} from "./SpotifyClient";

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
			throw new RequestError("Failed to refresh access token for user, status code: " + response.statusCode);
		}

		// assign token etc to user
		this.accessToken = response.body.access_token;
		const d = new Date();
		d.setSeconds(d.getSeconds() + response.body.expires_in);
		this.accessTokenExpiryDate = d;
		this.grantedScopes = response.body.scope.split(" ");
	}

	// make request to spotify api
	// This method handles rate limits and access token refreshing.
	async makeRequest() {
		// get refresh token if neccessary
		// make request
		// this.client._makeRequest()
	}
}
