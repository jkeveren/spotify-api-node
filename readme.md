# Package Name

## Testing
Both unit and integration (requires conjfiguration) tests can be run using `npm test`.
### Unit
Unit tests can be run using `npm run test/unit`.
### Integration
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
# When the user provides authorization, Spotify will redirect to a server hosted
# for the integration testing. This should be the same as the port specified in
# the redirect URL of your Spotify app.
REDIRECT_SERVER_PORT=8000

# The base URL for all API requests
# documented in the API reference:
# https://developer.spotify.com/documentation/web-api/reference/#/
BASE_URL=https://api.spotify.com/v1

# Client credentials
CLIENT_ID=<your app's client id>
CLIENT_SECRET=<your app's client secret>
```

## TODO
- test getting non-string data like images
- choose a sensible package name
- Figure out how to handle state param in first oauth request
- JSDocs
- Make sure names are sensible
- document everything
- verify that spotify app needs to be in dev mode and that you need to add your account to the app's "users and access" section of the app's dashboard
- verify config docs against config that's in use
- test export of smaller things like error types and response interface
- document usage
- document scripts
