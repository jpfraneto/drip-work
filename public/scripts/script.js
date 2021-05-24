window.onload = () => {
  document.getElementById('addMissionBtn').addEventListener('click', addMission);
  document.getElementById('setTimerBtn').addEventListener('click', setTargetEndingTime)
  document.getElementById('clearTimerBtn').addEventListener('click', clearTimer);

  document.getElementById('changeTopicBtn').addEventListener('click', () => {
    document.getElementById('chosenTopicDisplay').innerText = "";
    document.getElementById('sessionTopicForm').style.display = 'block';
    document.getElementById('sessionCreation').style.display = 'none';
    document.getElementById('newSessionDiv').style.display = 'none';
    document.getElementById('sessionMissionsAndObjectives').style.display = 'none'
  })

  var listOfSessions = document.getElementById('scheduledSessionsUl');
  if(listOfSessions){
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
          localStorage.setItem('sessionID', sessionID);
          updateNewSession(data.queriedSession);
        })
        .catch((error) => {
          console.error('Error:', error);
        });
    })
  }

  document.getElementById('newSessionBtn').addEventListener('click', () => {
    document.getElementById('landingDiv').style.display = 'none';
    document.getElementById('sessionTopicForm').style.display = 'block';
  })

  document.getElementById('chooseTopicForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    var radios = document.getElementsByName('sessionTopic');
    var chosenTopic;

    for (var i = 0, length = radios.length; i < length; i++) {
      if (radios[i].checked) {
        chosenTopic = radios[i].value;
        break;
      }
    }

    document.getElementById('chosenTopicDisplay').innerText = chosenTopic;
    document.getElementById('runningChosenTopicDisplay').innerText = chosenTopic;
    document.getElementById('sessionTopicForm').style.display = 'none';
    document.getElementById('sessionCreation').style.display = 'block';
    document.getElementById('newSessionDiv').style.display = 'block';
    document.getElementById('sessionMissionsAndObjectives').style.display = 'block'

  })

  document.getElementById('addTopicBtn').addEventListener('click', () => {

    let newTopic = document.getElementById('newTopic').value;

    if(newTopic){
      fetch('/addTopicToUser', {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({newTopic: newTopic}),
        })
        .then(response => response.json())
        .then(data => {
          document.getElementById('newTopic').value = "";
          var radioHtml = '<input type="radio" name="sessionTopic" id="' + newTopic + 'Radio" value="' + newTopic +'" checked="checked" />';
          var radioLabel = '<label for="' + newTopic + 'Radio">'+ newTopic+ '</label>'
          var radioFragment = document.createElement('div');
          radioFragment.innerHTML = radioHtml + radioLabel;
          document.getElementById('topicSelection').appendChild(radioFragment);
        })
        .catch((error) => {
          console.error('Error:', error);
        });
    } else {
      alert('Please add a new topic!')
    }
   
  })

  document.getElementById('sessionScheduleForm').addEventListener('submit', (e) => {
      e.preventDefault();
      let formData = getFormData(document.getElementById('sessionScheduleForm'));
      let hours = formData.hours || 0;
      let minutes = formData.minutes || 0;
      let seconds = formData.seconds || 0;
      var totalMiliseconds = hours * 60 * 60 * 1000 + minutes * 60 * 1000 + seconds * 1000;
      hours   = (hours   < 10 ? "0" : "") + hours;
      minutes = (minutes < 10 ? "0" : "") + minutes;
      seconds = (seconds < 10 ? "0" : "") + seconds;

      if (totalMiliseconds > 0) {
        var missions = [];
        var missionsTable = document.getElementById('sessionMissionsTable');
        //THis is extremely dangerous code, if the table order gets changed it won't work.
        for (var i = 0, row; row=missionsTable.rows[i] ; i++){
          if(i>0) {
            missions.push ({
              mission : row.cells[0].innerText, 
              missionComments : row.cells[1].innerText, 
              completed : false
            })
          }
          row.deleteCell(3);
        }

      let comments = formData.comments;
        startSession(missions, comments, totalMiliseconds);
        document.getElementById('clock').innerHTML = hours + ":" + minutes + ":" + seconds;
        document.getElementById('sessionCreation').style.display = 'none';
        document.getElementById('sessionRunning').style.display = 'block';
        document.getElementById('sessionCommentsTitle').style.display = 'block';
      } else alert('Please add the time you want to focus!');
  });
}

function startSession (missions, comments, targetDuration) {
  document.getElementById('sessionComments').innerText = comments;

  var timerObj = startTimer(targetDuration);
  var now = new Date().getTime();
  localStorage.setItem('startingTimestamp', now) ;

  document.getElementById('pauseSessionBtn').addEventListener('click', timerObj.pause);
  document.getElementById('resumeSessionBtn').addEventListener('click', timerObj.resume);
  document.getElementById('stopSessionBtn').addEventListener('click', () => {
    stopSession(timerObj.timer);
  });

  var currentUser = document.getElementById('currentUserP').innerText;
  var sessionTopic = document.getElementById('chosenTopicDisplay').innerText;

  var query = {
    sessionTopic : sessionTopic,
    username : currentUser,
    targetDuration : targetDuration,
    missions : missions,
    comments : comments,
    startingTimestamp : now,
  };

  if(document.getElementById('scheduledBoolean').innerText === 'scheduled'){
    query.sessionID = localStorage.getItem('sessionID');
    query.scheduled = true;
  }

  fetch('/startSession', {
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
    var now = Math.max(0, ms-(new Date().getTime() - startTime));
    var h = Math.floor((now % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var m = Math.floor((now % (1000 * 60 * 60)) / (1000 * 60));
    var s = Math.floor((now % (1000 * 60)) / 1000);
    h = (h<10 ? "0" : "") + h;
    m = (m<10 ? "0" : "") + m;
    s = (s<10 ? "0" : "") + s;
    display.innerHTML = h + ':' + m + ':' + s ;
    var timerInTab = document.getElementById('timerInTabBtn').checked;
    if(timerInTab) document.title = ('Drip Work App - ' + h + ':' + m + ':' + s );
    else document.title = ('Drip Work App')
    if (now == 0){
      localStorage.setItem('elapsedTime', obj.elapsedTime);
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
  // document.getElementById('sessionMissionsAndObjectives').style.display = 'none';
}

document.getElementById('sessionResultsForm').addEventListener('submit', (e) => {
  e.preventDefault();
  let sessionID = localStorage.getItem('sessionID');
  let sessionDuration = Math.round(localStorage.getItem('elapsedTime'));
  let formData = getFormData(document.getElementById('sessionResultsForm'));
  let sessionComments = document.getElementById('sessionComments').innerText;

  if (formData.feelingRating > 0) {

    var query = {
      sessionDuration : sessionDuration,
      feelingRating : formData.feelingRating,
      sessionComments : sessionComments,
      afterSessionComments : formData.afterSessionComments,
      sessionID : sessionID
    }

    if(document.getElementById('scheduledBoolean').innerText === 'scheduled'){
      query.scheduled = false
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
      document.getElementById('sessionMissionsAndObjectives').style.display = 'none';
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

function addMissionTag(newMission) {

    var tableBody = document.getElementById('sessionMissionsTableBody');
    var row = tableBody.insertRow(tableBody.length);
    row.classList.add('missionRow');
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    var cell4 = row.insertCell(3);
    cell1.addEventListener('click', ()=> {
      cell1.classList.toggle("completed");
    })
    cell4.addEventListener('click', () => {
      if(confirm('Are you sure you want to delete this mission?')) row.remove()
    })
    cell1.innerHTML = newMission;
    cell2.innerHTML = '<span contenteditable="true">Add Comments Here</span>'
    cell4.innerHTML = '<p class="deleteMission">🗑️</p>'
    cell4.classList.add('deleteMissionCell')
    cell3.innerHTML = 'Completed?';
    cell3.addEventListener('click', ()=> {
      cell1.classList.toggle("completed");
      row.classList.toggle("completedRow");
    })
}

function addMission() {
  let newMission = document.getElementById('sessionMission').value;
  if(newMission) {
    addMissionTag(newMission);
    document.getElementById('sessionMission').value = "";
  } else {
    alert('Please enter a new mission!')
  }
}

function updateNewSession(data) {
  document.getElementById('landingDiv').style.display = 'none';
  document.getElementById('newSessionDiv').style.display = 'block';

  document.getElementById('missionCommentsInput').innerText = data.comments;
  document.getElementById('scheduledBoolean').innerText = 'scheduled'
  document.getElementById('chosenTopicDisplay').innerText = data.topic;
  document.getElementById('runningChosenTopicDisplay').innerText = data.topic;


  var duration = msToTime(data.targetDuration);
  document.getElementById('hoursInput').value = duration.hours;
  document.getElementById('minutesInput').value = duration.minutes;
  document.getElementById('secondsInput').value = duration.seconds;
  data.missions.forEach((mission) => {
    addMissionTag(mission.mission);
  })
  document.getElementById('sessionMissionsAndObjectives').style.display = 'block';
}

function msToTime(duration) {
  var response = {};
  var milliseconds = Math.floor((duration % 1000) / 100);
  response.seconds = Math.floor((duration / 1000) % 60);
  response.minutes = Math.floor((duration / (1000 * 60)) % 60);
  response.hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  return response
}