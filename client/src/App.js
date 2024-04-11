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
const soundClips = document.querySelector(".sound-clips");

let mediaRecorder, chunks = [], audioURL = '';

// Main block for doing the audio recording
if (navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices
    .getUserMedia(
      // constraints - only audio needed for this app
      {
        audio: true,
      },
    )

    // Success callback
    .then((stream) => {
      
        mediaRecorder = new MediaRecorder(stream);
    
        mediaRecorder.onstop = function (e) {
          console.log("Last data to read (after MediaRecorder.stop() called).");
    
          const clipName = prompt(
            "Enter a name for your sound clip?",
            "My unnamed clip"
          );
    
          const clipContainer = document.createElement("article");
          const clipLabel = document.createElement("p");
          const audio = document.createElement("audio");
          const deleteButton = document.createElement("button");
    
          clipContainer.classList.add("clip");
          audio.setAttribute("controls", "");
          deleteButton.textContent = "Delete";
          deleteButton.className = "delete";
    
          if (clipName === null) {
            clipLabel.textContent = "My unnamed clip";
          } else {
            clipLabel.textContent = clipName;
          }
    
          clipContainer.appendChild(audio);
          clipContainer.appendChild(clipLabel);
          clipContainer.appendChild(deleteButton);
          soundClips.appendChild(clipContainer);
    
          audio.controls = true;
          const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
          chunks = [];
          const audioURL = window.URL.createObjectURL(blob);
          audio.src = audioURL;
          console.log("recorder stopped");
    
          deleteButton.onclick = function (e) {
            e.target.closest(".clip").remove();
          };
    
          clipLabel.onclick = function () {
            const existingName = clipLabel.textContent;
            const newClipName = prompt("Enter a new name for your sound clip?");
            if (newClipName === null) {
              clipLabel.textContent = existingName;
            } else {
              clipLabel.textContent = newClipName;
            }
          };
        };
    
        mediaRecorder.ondataavailable = function (e) {
          chunks.push(e.data);
        };

    })

    // Error callback
    .catch((err) => {
      console.error(`The following getUserMedia error occurred: ${err}`);
    });
  console.log("The mediaDevices.getUserMedia() method is supported.");

 
} else {
  console.log("MediaDevices.getUserMedia() not supported on your browser!");
}



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
      mediaRecorder.start();
      console.log(mediaRecorder.state);
      console.log("Recorder started.");

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
        mediaRecorder.stop();
        console.log(mediaRecorder.state);
        console.log("Recorder stopped.");

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
