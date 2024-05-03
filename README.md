# Overview
This sample application showcases real-time speech transcription using the Azure Speech SDK for Javascript. The app is made up of two parts, a React front-end and a Nodejs backend API. 

The front-end uses Material UI components to demonstrate a start/stop function, a recording timer, user-editable result text, and the display of both temporary and finalized transcription results. The front-end authenticates to the Speech service using an access token that is silently and automatically refreshed before it's 10 minute expiration. This allows for continuous real-time Speech transcription for an indefinite duration.

The server-side code exposes a simple API that the front-end can call in order to retrieve a Speech service access token. The access token is generated server-side using the Speech service subscription key stored in an environment variable. This demonstrates how an app can authenticate directly to the Speech service without ever having to expose the Speech service subscription key to the front-end.


# Installation
### Clone the repository
```
git clone https://github.com/Kthwaits/azure-speech-to-text-sample-app
```

### Rename `server/.env-sample` to `.env` and populate variables

```
SPEECH_KEY=paste-your-speech-key-here
SPEECH_REGION=paste-your-speech-region-here
```

### Start the API backend
```
cd server
npm install
node index.js
```

### Start the client
Open a second terminal (keep the first terminal open and running the API backend) and start the client app

```
cd client
npm install
npm start
```

### Launch the web interface
If a browser window does not launch automatically, navigate to http://localhost:3000/ to view the web app
