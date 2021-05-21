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

function sessionMissions (element) {
  fetch('/getSessionInformation', {
    method: 'POST', 
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({sessionID : element.dataset.id}),
    })
    .then(response => response.json())
    .then(data => {
      if (data) {
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