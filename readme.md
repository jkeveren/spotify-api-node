# jkeveren-spotify-api
`npm install jkeveren-spotify-api`
- TypeScript (Still works with regular JS)
- Promise based
- 0 Dependencies
- Automatically refreshes tokens
- Coming soon: Handles rate limit

# Usage/Reference
## SpotifyClient

# Reference

## Development
Both unit and integration (requires configuration) tests can be run using `npm test`.
### Unit tests
Unit tests can be run using `npm run test/unit`.
### Integration tests
Integration tests communicate with Spotify's API so requires some configuration.
Once configured, integration tests can be run using `npm run test/integration`.
#### Configuration
1. Create a Spotify app in the [developer dashboard](https://developer.spotify.com/dashboard/).
	- Add recirect URL `http://localhost:<port>` where `<port>` is the same as `REDIRECT_SERVER_PORT` in the .env file that you will create in the next step.
	- Keeping the app in developmnent mode is recommended as it allows any scopes to be requested.
	- If your app is in development mode, give your Spotify account access in the "USERS AND ACCESS" section in the app's Spotify dashboard.
1. Create a `.env` file inside the `test-integration` directory. Copy and modify following variables:
```
# Port for the redirect server to listen on
# The integration suite starts a temporary server for Spotify to redirect to.
# This is the port that it listens on
REDIRECT_SERVER_PORT=8000

# Base URLs for auth and API.
# Documneted in Spotify's API docs:
# Auth: https://developer.spotify.com/documentation/general/guides/authorization/
# API: https://developer.spotify.com/documentation/web-api/reference/#/
# Typical values are as follows:
AUTH_BASE_URL=https://accounts.spotify.com
API_BASE_URL=https://api.spotify.com/v1

# Client credentials
# Copy these from you're spotify app in the Spotify developer dashboard:
# https://developer.spotify.com/dashboard
CLIENT_ID=999b871166be415590457fc76f5898b4
CLIENT_SECRET=c2df8bfbbd8044b2b87899fe451615f6
```

## TODO
- Make sure names are sensible
- document everything
- document usage
- JSDoc everything else
- test requesting and uploading non-string objects like images
- verify that spotify app needs to be in dev mode and that you need to add your account to the app's "users and access" section of the app's dashboard
- handle rate limits. (per user request queue?)
- add user constructor
- add integration test for state
- add tests for SpotifyRequestError properties
- handle getUser with no scopes
