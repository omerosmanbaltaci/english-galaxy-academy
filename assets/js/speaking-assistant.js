let recognition = null;
let isRecording = false;

function openSpeakingAssistant() {
    const modal = document.getElementById('speaking-modal');
    modal.style.display = 'flex';
    document.getElementById('speaking-text').innerHTML = "Click the microphone to start speaking. Try introducing yourself or reading a sentence from the unit!";
    document.getElementById('speaking-feedback').innerHTML = "";
    document.getElementById('btn-mic').classList.remove('recording');
}

function closeSpeakingAssistant() {
    document.getElementById('speaking-modal').style.display = 'none';
    if (recognition && isRecording) {
        recognition.stop();
        isRecording = false;
    }
}

function toggleRecording() {
    if (isRecording) {
        recognition.stop();
        isRecording = false;
        document.getElementById('btn-mic').classList.remove('recording');
        return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert("Your browser does not support Speech Recognition. Please use Chrome or Edge.");
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = function() {
        isRecording = true;
        document.getElementById('btn-mic').classList.add('recording');
        document.getElementById('speaking-text').innerHTML = "Listening...";
        document.getElementById('speaking-feedback').innerHTML = "";
    };

    recognition.onresult = function(event) {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        
        if (finalTranscript) {
            document.getElementById('speaking-text').innerHTML = `<strong>You said:</strong> "${finalTranscript}"`;
            analyzeSpeech(finalTranscript);
        } else {
            document.getElementById('speaking-text').innerHTML = `<i>${interimTranscript}</i>`;
        }
    };

    recognition.onerror = function(event) {
        console.error("Speech recognition error", event.error);
        document.getElementById('speaking-text').innerHTML = "Error recognizing speech. Please try again.";
        isRecording = false;
        document.getElementById('btn-mic').classList.remove('recording');
    };

    recognition.onend = function() {
        isRecording = false;
        document.getElementById('btn-mic').classList.remove('recording');
    };

    recognition.start();
}

function analyzeSpeech(text) {
    // Simple mock analysis
    const wordCount = text.split(' ').length;
    let feedback = '';
    if (wordCount < 3) {
        feedback = "Good start! Try speaking a bit longer.";
    } else {
        feedback = "Excellent! Your pronunciation was very clear. 🌟";
    }
    document.getElementById('speaking-feedback').innerHTML = feedback;
}
