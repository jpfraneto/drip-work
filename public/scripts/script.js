window.onload = () => {
    document.getElementById('addMissionBtn').addEventListener('click', addMission);
    document.getElementById('setTimerBtn').addEventListener('click', setTargetEndingTime)
    document.getElementById('clearTimerBtn').addEventListener('click', clearTimer);
    document.getElementById('suggestionsBtn').addEventListener('click', ()=>{
      alert('If you have any suggestions on making this place better, email me at jpfraneto@gmail.com. I appreciate it, it benefits us all.')
    })

    var listOfSessions = document.getElementById('scheduledSessionsUl');
    listOfSessions.addEventListener('click', e => {
      const sessionID = e.target.getAttribute('data-sessionID');
      fetch('/getSessionInformation', {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({sessionID: sessionID}),
        })
        .then(response => response.json())
        .then(data => {
          console.log('this sessions data is: ');
          console.log(data);
        })
        .catch((error) => {
          console.error('Error:', error);
        });
    })

    document.getElementById('newSessionBtn').addEventListener('click', () => {
      document.getElementById('landingDiv').style.display = 'none';
      document.getElementById('newSessionDiv').style.display = 'block';
    })

    document.getElementById('showScheduledSessions').addEventListener('click', () => {
      document.getElementById('landingDiv').style.display = 'block';
      document.getElementById('newSessionDiv').style.display = 'none';
    }
    )

    document.getElementById('sessionScheduleForm').addEventListener('submit', (e) => {
        e.preventDefault();
        let formData = getFormData(document.getElementById('sessionScheduleForm'));
        let hours = formData.hours;
        let minutes = formData.minutes;
        let seconds = formData.seconds || "0";
        var totalMiliseconds = hours * 60 * 60 * 1000 + minutes * 60 * 1000 + seconds * 1000;
        minutes = hours * 60 + minutes;
        minutes = (minutes < 10 ? "0" : "") + minutes;
        seconds = (seconds < 10 ? "0" : "") + seconds;
        console.log(minutes,seconds);

        var missions = [];
        var missionsUl = document.getElementsByClassName('missionLi');
        for (var i = 0; i<missionsUl.length ; i++){
            missions.push({mission:missionsUl[i].innerHTML, completed:false})
        }

        let comments = formData.comments;

        if (totalMiliseconds > 0) {
          startSession(missions, comments, totalMiliseconds);
          document.getElementById('clock').innerHTML = minutes + ":" + seconds;
          document.getElementById('sessionCreation').style.display = 'none';
          document.getElementById('sessionRunning').style.display = 'block';
        } else alert('Please add the time you want to focus!');
    });
}

function startSession (missions, comments, targetDuration) {
  document.getElementById('sessionComments').innerText = comments;

  missions.reverse().forEach((missionObj)=>{
    var tableBody = document.getElementById('sessionMissionsTableBody');
    var row = tableBody.insertRow(0);
    row.classList.add('missionRow');
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    cell1.addEventListener('click', ()=>{
      cell1.classList.toggle("completed");
    })
    cell1.innerHTML = missionObj.mission;
    cell2.innerHTML = '<span contenteditable="true">Comment</span>'
  })

  var timerObj = startTimer(targetDuration);
  var now = new Date().getTime();
  localStorage.setItem('startingTimestamp', now) ;

  document.getElementById('pauseSessionBtn').addEventListener('click', timerObj.pause);
  document.getElementById('resumeSessionBtn').addEventListener('click', timerObj.resume);
  document.getElementById('stopSessionBtn').addEventListener('click', () => {
    stopSession(timerObj.timer);
  });

  var currentUser = document.getElementById('currentUser').innerText;

  var query = {
    username : currentUser,
    targetDuration : targetDuration,
    missions : missions,
    comments : comments,
    startingTimestamp : now
  };

  fetch('/startNewSession', {
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

function startTimer (ms) {
  var startTime, timer, obj, elapsedTime, display = document.getElementById('clock');
  obj = {elapsedTime:500}; 
  obj.resume = function () {
    startTime = new Date().getTime();
    timer = setInterval(obj.step, 500);
    obj.timer = timer;
    document.getElementById('pauseSessionBtn').style.display = 'inline-block';
    document.getElementById('resumeSessionBtn').style.display = 'none';
    document.getElementById('stopSessionBtn').style.display = 'none';
  }
  obj.pause = function () {
    localStorage.setItem('elapsedTime', obj.elapsedTime) ;
    ms = obj.step();
    clearInterval(timer);
    document.getElementById('pauseSessionBtn').style.display = 'none';
    document.getElementById('resumeSessionBtn').style.display = 'inline-block';
    document.getElementById('stopSessionBtn').style.display = 'inline-block';
  }
  obj.step = function () {
    obj.elapsedTime += 500;
    var now = Math.max(0, ms-(new Date().getTime() - startTime)),
    m = Math.floor(now/60000), s= Math.floor(now/1000)%60;
    m = (m<10 ? "0" : "") + m;
    s = (s<10 ? "0" : "") + s;
    display.innerHTML = m + ':' + s ;
    document.title = ('Drip Work App - ' + m + ':' + s );
    if (now == 0){
      clearInterval(timer);
      endSession();
    }
    return now
  }
  obj.resume();
  return obj
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
  let sessionDuration = Math.round(localStorage.getItem('elapsedTime'));
  let formData = getFormData(document.getElementById('sessionResultsForm'));

  if (formData.feelingRating > 0) {

    var query = {
      sessionDuration : sessionDuration,
      feelingRating : formData.feelingRating,
      comments : formData.sessionComments,
      sessionID : sessionID
    }
  
    var sessionMissions = document.getElementsByClassName('missionRow');
    query.sessionMissions = [];
    for (var i=0; i<sessionMissions.length;i++) {
      var thisMission = {completed:false};
      thisMission.mission = sessionMissions[i].childNodes[0].innerText;
      thisMission.missionComments = sessionMissions[i].childNodes[1].innerText;
      if(sessionMissions[i].childNodes[0].classList.contains('completed')){
        thisMission.completed = true;
      }
      query.sessionMissions.push(thisMission);
    }
    saveSessionToDB(query);
  } else {
    alert('How did you feel in this session?');
    document.getElementById('feelingRating').focus();
  }
})

function saveSessionToDB (query) {
  fetch('/endSession', {
    method: 'POST', 
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(query),
    })
    .then(response => response.json())
    .then(data => {
      document.getElementById('resultsMessage').innerText = data.message;
      document.getElementById('sessionClosing').style.display = 'none';
      document.getElementById('sessionResults').style.display = 'block';
      document.title = ('Drip Work App - Session Complete');
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

function stopSession (timer, elapsedTime) {
  if (confirm('Are you sure you want to stop this session?')) {
    clearTimeout(timer);
    endSession(elapsedTime);
    document.title = ('Drip Work App');
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
  let formData = getFormData(document.getElementById('sessionScheduleForm'));
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

function addMissionTag() {
  if(document.getElementById('sessionMission').value) {
    let newMission = document.getElementById('sessionMission').value;
    let li = document.createElement('li');
    li.appendChild(document.createTextNode(newMission));
    li.classList.add('missionLi');
    document.getElementById('sessionMissions').appendChild(li);
    document.getElementById('sessionMission').value = "";
    return newMission
  } else {
    alert('Please enter a mission!')
  }

}

function addMission() {
  addMissionTag();
}