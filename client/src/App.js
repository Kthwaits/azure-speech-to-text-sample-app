import React, { useState, useRef, useEffect } from 'react';
import Button from '@mui/material/Button';
import MicIcon from '@mui/icons-material/Mic';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { getTokenOrRefresh } from './utils/getTokenOrRefresh';
import './App.css';

const speechsdk = require('microsoft-cognitiveservices-speech-sdk')

function App() {
  const recognizerRef = useRef(null);
  const [displayText, setDisplayText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [recordingActive, setRecordingActive] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const recordingIntervalRef = useRef(null);

  useEffect(() => {
    if (recordingActive) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTimer(prevTime => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(recordingIntervalRef.current);
      setRecordingTimer(0);
    }
  }, [recordingActive]);

  useEffect(() => {
    if (recordingActive) {
      const refreshInterval = setInterval(async () => {
        const tokenObj = await getTokenOrRefresh();
        recognizerRef.current.authToken = tokenObj.authToken;
      }, 9 * 60 * 1000); // 9 minutes
      return () => {
        clearInterval(refreshInterval);
      };
    }
  }, [recordingActive]);

  function onRecognizing(sender, recognitionEventArgs) {
    const resultText = recognitionEventArgs?.result?.text;
    if (resultText) {
      setInterimText(resultText);
    }
  }
  function onRecognized(sender, recognitionEventArgs) {
    const resultText = recognitionEventArgs?.result?.text;
    if (resultText) {
      setDisplayText(prevDisplayText => `${prevDisplayText} ${resultText}`);
      setInterimText('');
    }
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
      speechConfig.enableDictation();
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
            recognizerRef.current = null;
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
      <Grid container spacing={1}>
        <Grid item xs={12}>
          <Box sx={{bgcolor: 'primary.main', color: 'white'}} padding={1}>
          <Typography variant="h4">
            Azure Speech to Text Sample App
          </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={2}>
          <Box margin={2} display="flex" justifyContent="center">
            <Button 
            variant="contained" 
            onClick={sttFromMic}
            startIcon={recordingActive ? <StopCircleIcon/> : <MicIcon/>}
            color={recordingActive ? "error" : "primary"}>
              {recordingActive ? `${recordingTimer / 60 < 10 ? '0' : ''}${Math.floor(recordingTimer / 60)}:${recordingTimer % 60 < 10 ? '0' : ''}${recordingTimer % 60}` : "Start"}
            </Button>
          </Box>
        </Grid>
        <Grid item xs={12} sm={10}>
          <Box margin={2}>
          <TextField
            fullWidth
            id="outlined-multiline-flexible"
            label="Speech Output"
            multiline
            minRows={4}
            value={recordingActive ? displayText + ' ' + interimText : displayText}
            onChange={(event) => {
              setDisplayText(event.target.value);
            }}
             disabled={recordingActive} // Disable editing while recording is active
          />
          </Box>
        </Grid>
      </Grid>
    </div>
  );
}

export default App;
