let totalMiliseconds;

window.onload = () => {
    document.getElementById('setTimerBtn').addEventListener('click', setTargetEndingTime)
    document.getElementById('clearTimerBtn').addEventListener('click', clearTimer);
    document.getElementById('pauseSessionBtn').addEventListener('click', pauseSession);
    document.getElementById('resumeSessionBtn').addEventListener('click', resumeSession);
    document.getElementById('stopSessionBtn').addEventListener('click', stopSession);
    document.getElementById('suggestionsBtn').addEventListener('click', ()=>{
      alert('If you have any suggestions on making this place better, email me at jpfraneto@gmail.com. I appreciate it, it benefits us all.')
    })

    document.getElementById('timePicker').addEventListener('submit', (e) => {
        e.preventDefault();
        let formData = getFormData(document.getElementById('timePicker'));
        let hours = formData.hours;
        let minutes = formData.minutes;
        let seconds = formData.seconds;
        let mission = formData.mission;

        totalMiliseconds = hours * 60 * 60 * 1000 + minutes * 60 * 1000 + seconds * 1000;
        let now = (new Date()).getTime();
        let endingTimestamp = totalMiliseconds + now;

        if (totalMiliseconds > 0) {
          document.getElementById('sessionCreation').style.display = 'none';
          document.getElementById('sessionRunning').style.display = 'block';
          document.getElementById('sessionObjectives').innerText = mission;
          startSession(mission, totalMiliseconds, now);
        } else alert('Please add the time you want to focus!');
    });
}

function startSession (mission, totalMiliseconds, now) {
  runClock(totalMiliseconds+now);
  var currentUser = document.getElementById('currentUser').innerText;
  localStorage.setItem('startingTimestamp', totalMiliseconds+now);
  localStorage.setItem('sessionDuration', totalMiliseconds);
  var query = {
    username : currentUser,
    targetDuration : totalMiliseconds,
    mission : mission,
    startingTimestamp : now
  };
  fetch('/newSession', {
  method: 'POST', 
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(query),
  })
  .then(response => response.json())
  .then(data => {
    localStorage.setItem('sessionID', data.sessionID);
  })
  .catch((error) => {
    console.error('Error:', error);
  });
}

function runClock (endingTimestamp) {
    let remainingMs = endingTimestamp - (new Date().getTime());
    const seconds = Math.floor( (remainingMs/1000) % 60 );
    const minutes = Math.floor( (remainingMs/1000/60) % 60 );
    const hours = Math.floor( (remainingMs/(1000*60*60)) % 24 );
    document.getElementById('clock').innerText = (twoDigits(hours) + ':' + twoDigits(minutes) + ':' + twoDigits(seconds));
    if (remainingMs>888) {
      setTimeout(runClock, 1000, endingTimestamp);
    } else {
      endSession();
    }
}

function runClock2 (endingTimestamp) {
  var intervalId = setInterval(() => {
    var now = new Date().getTime();
    var timeleft = endingTimestamp - now;
    if(timeleft > 0) {
      const seconds = Math.floor( (timeleft/1000) % 60 );
      const minutes = Math.floor( (timeleft/1000/60) % 60 );
      const hours = Math.floor( (timeleft/(1000*60*60)) % 24 );
      document.getElementById('clock').innerText = (twoDigits(hours) + ':' + twoDigits(minutes) + ':' + twoDigits(seconds));
    } else {
      endSession();
    }
  }, 1000);
  localStorage.setItem('intervalID', intervalId);
}

function twoDigits (n) {
    return (n<10 ? '0' : '') + n 
}

function endSession () {
  var audio = document.getElementById('finishAudio');
  audio.play();
  document.getElementById('sessionRunning').style.display = 'none';
  document.getElementById('sessionClosing').style.display = 'block';
}

document.getElementById('sessionResultsForm').addEventListener('submit', (e) => {
  e.preventDefault();
  let sessionID = localStorage.getItem('sessionID');
  let sessionDuration = localStorage.getItem('sessionDuration');
  let formData = getFormData(document.getElementById('sessionResultsForm'));
  var query = {
    sessionDuration : sessionDuration,
    feelingRating : formData.feelingRating,
    comments : formData.sessionComments,
    sessionID : sessionID
  }
  fetch('/endSession', {
    method: 'POST', 
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(query),
    })
    .then(response => response.json())
    .then(data => {
      console.log('The session was saved in the DB');
      document.getElementById('resultsMessage').innerText = data.message;
      document.getElementById('sessionClosing').style.display = 'none';
      document.getElementById('sessionResults').style.display = 'block';
    })
    .catch((error) => {
      console.error('Error:', error);
    });
})

function pauseSession () {
  document.getElementById('pauseSessionBtn').style.display = 'none';
  document.getElementById('resumeSessionBtn').style.display = 'inline-block';
  document.getElementById('stopSessionBtn').style.display = 'inline-block';
  alert('The session should be paused');
}

function resumeSession () {
  document.getElementById('pauseSessionBtn').style.display = 'inline-block';
  document.getElementById('resumeSessionBtn').style.display = 'none';
  document.getElementById('stopSessionBtn').style.display = 'none';
  alert('The session should be resumed');
}

function stopSession () {
  if (confirm('Are you sure you want to stop this session?')) {
    alert('Now the session should be stopped')
  } else {
    alert('You did not confirm')
  }
}

function getFormData (form) {
  var formElements = form.elements;
  var obj = {};
  for (var i=0 ; i < formElements.length; i++){
    var item = formElements.item(i);
    obj[item.name] = item.value;
  }
  return obj
}

function setTargetEndingTime () {
  document.getElementById('clearTimerBtn').style.display = 'inline-block'
  let formData = getFormData(document.getElementById('timePicker'));
  let hours = formData.hours;
  let minutes = formData.minutes;
  let seconds = formData.seconds;
  totalMiliseconds = hours * 60 * 60 * 1000 + minutes * 60 * 1000 + seconds * 1000;
  let now = (new Date()).getTime();
  let endingTimestamp = totalMiliseconds + now;
  let endingTime = new Date(endingTimestamp).toTimeString().split(' ')[0];
  document.getElementById('targetEndingTime').innerHTML = endingTime;
  document.getElementById('targetTime').style.display = 'block';
}

function clearTimer () {
  document.getElementById('clearTimerBtn').style.display = 'none';
  document.getElementById('targetTime').style.display = 'none';
  document.getElementById('hoursInput').value = 0;
  document.getElementById('minutesInput').value = 0;
  document.getElementById('secondsInput').value = 0;
}