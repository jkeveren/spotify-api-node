import {SpotifyUser} from "./SpotifyUser";
import http from "http";
import https from "https";
import path from "path";

const protocolMap = {
	"http:": http,
	"https:": https,
};

// config for client constructor
interface SpotifyClientConfig {
	authBaseURL: string;
	APIBaseURL: string; // SpoitfyUser.makeRequest concatenates the endpoint argument with this
	clientId: string;
	clientSecret: string;
}

export class SpotifyClient {
	config: SpotifyClientConfig;

	// internal request function
	// mutable for mocking
	_internalMakeRequest: (url: URL, options: any, requestBody: string) => Promise<SpotifyResponse>;

	constructor(config: SpotifyClientConfig) {
		this.config = config;

		// set up default requester
		this._internalMakeRequest = defaultInternalMakeRequest;
	}

	// https://developer.spotify.com/documentation/general/guides/authorization/code-flow/#request-user-authorization
	getAuthorizationURL(redirectURL: string, scopes: string[], state: string, showDialog: boolean): URL {
		const u = new URL(this.config.authBaseURL + "/authorize");
		u.searchParams.set("client_id", this.config.clientId);
		u.searchParams.set("response_type", "code");
		u.searchParams.set("redirect_uri", redirectURL);
		u.searchParams.set("state", state);
		u.searchParams.set("scope", scopes.join(" "));
		u.searchParams.set("show_dialog", showDialog.toString());
		return u;
	}

	// Creates a user with tokens
	// https://developer.spotify.com/documentation/general/guides/authorization/code-flow/#request-access-token
	async getUser(code: string, redirectURL: string): Promise<SpotifyUser> {
		// get tokens
		const url = new URL(this.config.authBaseURL);
		url.pathname = path.resolve(url.pathname, "api/token");

		const options = {
			method: "POST",
			headers: {
				authorization: "Basic " + Buffer.from(this.config.clientId + ":" + this.config.clientSecret).toString("base64"),
				"content-type": "application/x-www-form-urlencoded",
			}
		};

		const body = new URLSearchParams({
			grant_type: "authorization_code",
			code: code,
			redirect_uri: redirectURL,
		}).toString();

		const response = await this._internalMakeRequest(url, options, body);

		if (response.statusCode != 200) {
			throw new SpotifyRequestError("Failed to get tokens for user", url.href, response);
		}

		const user = new SpotifyUser();
		user.client = this;
		user.accessToken = response.body.access_token;
		user.refreshToken = response.body.refresh_token;
		user.grantedScopes = response.body.scope.split(" ");

		const d = new Date();
		d.setSeconds(d.getSeconds() + response.body.expires_in);
		user.accessTokenExpiryDate = d;

		return user;
	}
}

export class SpotifyRequestError extends Error {
	requestURL: string;
	response: SpotifyResponse;

	constructor(message: string, requestURL: string, response: SpotifyResponse) {
		message += ` (statusCode: ${response.statusCode})`;
		super(message);
		this.requestURL = requestURL;
		this.response = response;
	}
}

export interface SpotifyResponse {
	statusCode: number;
	body: any;
	incomingMessage: http.IncomingMessage;
}

async function defaultInternalMakeRequest(url: URL, options: any, requestBody: string): Promise<SpotifyResponse> {
	const httpModule = protocolMap[url.protocol];

	// make request
	const response: http.IncomingMessage = await new Promise((resolve, reject) => {
		const request = httpModule.request(url, options, resolve);
		request.on("error", reject);
		request.end(requestBody);
	});

	// ready response body
	const responseBody: string = await new Promise((resolve, reject) => {
		let body = "";
		response.on("readable", () => {
			let chunk: string
			while (true) {
				chunk = response.read();
				if (chunk != null) {
					body += chunk;
				} else {
					break;
				}
			}
		});
		response.on("end", () => {
			resolve(body);
		})
		response.on("error", reject);
	});

	const spotifyResponse: SpotifyResponse = {
		statusCode: response.statusCode,
		body: responseBody,
		incomingMessage: response,
	};

	// parse body
	const contentType = response.headers["content-type"];
	if (contentType !== undefined && response.headers["content-type"].indexOf("application/json") === 0) {
		spotifyResponse.body = JSON.parse(spotifyResponse.body);
	}

	return spotifyResponse;
}
