let totalMiliseconds;

window.onload = () => {
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
          document.getElementById('clockDiv').style.display = 'block';
          document.getElementById('sessionObjectives').innerText = mission;
          document.getElementById('welcomeDiv').style.display = 'none';
          document.getElementById('timePicker').style.display = 'none';
          startSession(mission, totalMiliseconds, now);
        } else alert('Por favor agrega el tiempo que quieres concentrarte!');
    });
}

function startSession (mission, totalMiliseconds, now) {
  runClock(totalMiliseconds+now);
  console.log('empezó la nueva sesión');
  if(document.getElementById('currentUser')){
    var currentUser = document.getElementById('currentUser').innerText;
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

function twoDigits (n) {
    return (n<10 ? '0' : '') + n 
}

function endSession () {
  var audio = document.getElementById('finishAudio');
  audio.play();
  document.getElementById('clockDiv').style.display = 'none';
  document.getElementById('closeSession').style.display = 'block'
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
      document.getElementById('closeSession').style.display = 'none';
      document.getElementById('sessionResults').style.display = 'block';
    })
    .catch((error) => {
      console.error('Error:', error);
    });
})

function pauseClock () {
  alert('the clock should be paused');
}

function forcedEnd () {
  alert('the session has to end abruptly');
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