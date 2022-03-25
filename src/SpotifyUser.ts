import {Spotify} from "./Spotify"

export class SpotifyUser {
	spotify: Spotify
	accessToken: string
	accessTokenExpiryTime: Date
	refreshToken: string

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
	async makeRequest() {
		// get refresh token if neccessary
		// make request
		// this.spotify._makeRequest()
	}
}
