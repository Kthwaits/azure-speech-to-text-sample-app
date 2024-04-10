import React, { useState, useRef } from 'react';
import IconButton from '@mui/material/IconButton';
import MicIcon from '@mui/icons-material/Mic';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import TextField from '@mui/material/TextField';
import { getTokenOrRefresh } from './utils/getTokenOrRefresh';
import './App.css';

const speechsdk = require('microsoft-cognitiveservices-speech-sdk')

function App() {
  const recognizerRef = useRef(null);
  const [displayText, setDisplayText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [recordingActive, setRecordingActive] = useState(false);

  function onRecognizing(sender, recognitionEventArgs) {
    var result = recognitionEventArgs.result;
    setInterimText(result.text);
  }

  function onRecognized(sender, recognitionEventArgs) {
    var result = recognitionEventArgs.result;
    setDisplayText(prevDisplayText => prevDisplayText + ' ' + result.text);
    setInterimText('');
  }
  function onSessionStarted(sender, sessionEventArgs) {
    setRecordingActive(true);
  }
  function onSessionStopped(sender, sessionEventArgs) {
    setRecordingActive(false);
  }


  async function sttFromMic() {
    if (!recordingActive) {
      const tokenObj = await getTokenOrRefresh();
      const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
      speechConfig.speechRecognitionLanguage = 'en-US';
      const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
      recognizerRef.current = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);
      recognizerRef.current.recognizing = onRecognizing;
      recognizerRef.current.recognized = onRecognized;
      recognizerRef.current.sessionStarted = onSessionStarted;
      recognizerRef.current.sessionStopped = onSessionStopped;
      recognizerRef.current.startContinuousRecognitionAsync()
    }
    else {
      if (recognizerRef.current) {
        recognizerRef.current.stopContinuousRecognitionAsync(
          function () {
            recognizerRef.current.close();
            recognizerRef.current = null; // Set recognizer to null after closing
          },
          function (err) {
            console.log('ERROR: ' + err);
          }
        );
      }
    }
  }

  return (
    <div className="App">
      <IconButton size="large" onClick={sttFromMic}>
        {recordingActive ? <StopCircleIcon fontSize="inherit" /> : <MicIcon fontSize="inherit" />}
      </IconButton>
      <TextField
          fullWidth
          id="outlined-multiline-flexible"
          label="Speech Output"
          multiline
          rows={4}
          value={displayText + ' ' + interimText}
          onChange={(event) => {
            setDisplayText(event.target.value);
          }}
        />
    </div>
  );
}

export default App;
