window.onload = ()=> {
  var elapsedTimeWorking = document.getElementById('userPageTitle').dataset.elapsedTimeWorking;
  document.getElementById("workedTimeDisplay").addEventListener('change', (e)=>{
    let workedTime = timeConverter (e.target.value, elapsedTimeWorking);
    document.getElementById('displayTimeUnit').innerText = e.target.value;
    document.getElementById('elapsedTimeWorking').innerText = workedTime;
  });
  
  document.getElementById('topicDisplaySelection').addEventListener('change', (e) => {
    loadSessionsFromTopic(e.target.value);
  })
}

function sessionComments (element) {
      fetch('/getSessionComment', {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({sessionID : element.dataset.id}),
        })
        .then(response => response.json())
        .then(data => {
          alert(data.sessionComments);
        })
        .catch((error) => {
          console.error('Error:', error);
        });
}

function sessionMissions (elementID) {
  fetch('/getSessionInformation', {
    method: 'POST', 
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({sessionID : elementID}),
    })
    .then(response => response.json())
    .then(data => {
      if (data) {
        var modal = document.getElementById('modal-one');
        modal.classList.add('open');

        document.getElementById('closeModalBtn').addEventListener('click', function(event) {
          document.getElementById('modalMissionsDisplay').innerHTML = "";
          modal.classList.remove('open');
        })

        document.getElementById('modalXClose').addEventListener('click', function(event) {
          document.getElementById('modalMissionsDisplay').innerHTML = "";
          modal.classList.remove('open');
        })

        document.getElementById('modalSessionTopic').innerText = data.queriedSession.topic;
        document.getElementById('sessionBeforeComments').innerText = data.queriedSession.comments;
        document.getElementById('modalMissionDate').innerText = new Date(data.queriedSession.realStartingTimestamp).toDateString();
        document.getElementById('modalMissionTargetDuration').innerText = data.queriedSession.targetDuration/1000;
        document.getElementById('modalMissionRealDuration').innerText = data.queriedSession.realDuration/1000;
        document.getElementById('modalMissionCompletionRating').innerText = data.queriedSession.rating;
        document.getElementById('modalAfterComments').innerText = data.queriedSession.afterStats.afterComments;
        data.queriedSession.missions.forEach((mission) => {
          addMissionToModal(mission);
        })
      }
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

var modals = document.querySelectorAll('[data-modal]');

modals.forEach(function(trigger) {
  trigger.addEventListener('click', function(event) {
    event.preventDefault();
    var modal = document.getElementById(trigger.dataset.modal);
    modal.classList.add('open');
    var exits = modal.querySelectorAll('.modal-exit');
    exits.forEach(function(exit) {
      exit.addEventListener('click', function(event) {
        event.preventDefault();
        document.getElementById('modalMissionsDisplay').innerHTML = "";
        modal.classList.remove('open');
      });
    });
  });
});

function addMissionToModal(mission) {
  let li = document.createElement('li');
  li.innerHTML = '<p><strong>Mission: </strong>'+ mission.mission + ' <br> <strong>Comments:</strong> '+ mission.missionComments + ' <br> <strong>Completed? </strong>' + mission.completed +'</p> <hr>';
  document.getElementById('modalMissionsDisplay').appendChild(li);
}

function timeConverter (targetUnit, milliseconds) {
  let seconds = milliseconds/1000;
  if(targetUnit === 'Days') return (seconds / 86400).toFixed(2);
  if(targetUnit === 'Hours') return (seconds / 3600).toFixed(2);
  if(targetUnit === 'Minutes') return (seconds / 60).toFixed(2);
  if(targetUnit === 'Seconds') return seconds;
}

function loadSessionsFromTopic (topic) {
  fetch('/getSessionsByTopic', {
    method: 'POST', 
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({fetchedTopic : topic}),
    })
    .then(response => response.json())
    .then(queriedSessions => {
      queriedSessions = queriedSessions.filter(session => !session.scheduled)
      console.log('queried sessions', queriedSessions);
      if(queriedSessions.length > 0) populateSessionsDisplayTable(queriedSessions);
      else alert('Oops, there are no finished sessions here');
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

function populateSessionsDisplayTable(queriedSessions) {
  document.getElementById('userDisplayDiv').style.display = 'block';
  var tableBody = document.getElementById('sessionsDisplayTableBody');
  document.getElementById('selectedTopicTimeDisplay').style.display = 'block';
  tableBody.innerHTML = "";
  document.getElementById('topicAmountOfSessions').innerText = queriedSessions.length;
  var topicElapsedTime = 0;

  var row, topicCell, dateCell, targetTimeCell, realTimeCell, completionRatingCell, detailsCell;
  queriedSessions.reverse().forEach((session) => {
    row = tableBody.insertRow(tableBody.length);
    topicCell = row.insertCell(0);
    dateCell = row.insertCell(1);
    targetTimeCell = row.insertCell(2);
    realTimeCell = row.insertCell(3);
    completionRatingCell = row.insertCell(4);
    detailsCell = row.insertCell(5);

    topicCell.innerHTML = session.topic;
    dateCell.innerHTML = session.realStartingTimestamp;
    targetTimeCell.innerHTML = session.targetDuration / 1000;
    realTimeCell.innerHTML = session.realDuration / 1000;
    topicElapsedTime += session.realDuration/(60*1000);
    completionRatingCell.innerHTML = session.rating;
    detailsCell.innerText = 'Details'
    detailsCell.addEventListener('click', ()=>{
      sessionMissions(session._id);
    })
  })
  document.getElementById('workingTimeInThisTopic').innerText = topicElapsedTime.toFixed(2);
}