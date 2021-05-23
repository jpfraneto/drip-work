window.onload = () => {
    document.getElementById('addTopicBtn').addEventListener('click', addTopic);
    document.getElementById('addMissionBtn').addEventListener('click', addMission);
    document.getElementById('previewSessionBtn').addEventListener('click', previewSession);
    document.getElementById('editSessionBtn').addEventListener('click', editSession);

    document.getElementById('scheduleSessionForm').addEventListener('submit', (e) => {
        e.preventDefault();
        let formData = getFormData();

        var topic = document.getElementById('chosenTopicDisplay').innerText;
        var query = {
            date : formData.date,
            topic : topic,
            missions : formData.missions,
            comments : formData.comments,
            targetDuration : formData.totalMiliseconds
        }

        fetch('/schedule', {
            method: 'POST', 
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(query),
            })
            .then(response => response.json())
            .then(data => {
                document.getElementById('sessionScheduleReview').style.display = 'block';
                document.getElementById('scheduleSessionForm').style.display = 'none';
              document.getElementById('scheduleServerMessage').innerText = data.message;
            })
            .catch((error) => {
              console.error('Error:', error);
            });
    })
}

function addMission() {
    addMissionTag();
}

function addTopic () {
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
          addTopicTag(newTopic);
        })
        .catch((error) => {
          console.error('Error:', error);
        });
    } else {
      alert('Please add a new topic!')
    }

}

function addTopicTag(newTopic) {
    document.getElementById('newTopic').value = "";
    var radioHtml = '<input id="'+newTopic+'" type="radio" name="sessionTopic" value="'+ newTopic + '" checked="checked"/>';
    var labelHtml = '<label for="'+newTopic+'">'+ newTopic+'</label>'
    var radioFragment = document.createElement('div');
    radioFragment.innerHTML = radioHtml + " " + labelHtml;
    document.getElementById('topicSelection').appendChild(radioFragment);
}

document.getElementById('chooseTopicForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    var chosenTopic = document.querySelector('input[name="sessionTopic"]:checked').value;

    if(chosenTopic) {
        console.log(chosenTopic);
        document.getElementById('chosenTopicDisplay').innerText = chosenTopic;
        document.getElementById('sessionTopicForm').style.display = 'none';
        document.getElementById('scheduleSessionForm').style.display = 'block';
    } else {
        alert('If you want to get work done, it is important to define what you are going to work in!')
    }
  })

document.getElementById('changeTopicBtn').addEventListener('click', () => {
    document.getElementById('chosenTopicDisplay').innerText = "";
    document.getElementById('sessionTopicForm').style.display = 'block';
    document.getElementById('scheduleSessionForm').style.display = 'none';

})

function previewSession () {
    if (Date.parse(document.getElementById('sessionDate').value) < new Date()) return alert('Why do you want to schedule a session in the past?');
    document.getElementById('previewSessionBtn').style.display = 'none';
    document.getElementById('editSessionBtn').style.display = 'inline-block';
    document.getElementById('submitSessionBtn').style.display = 'inline-block';
    document.getElementById('sessionScheduleDiv').style.display = 'none';
    document.getElementById('sessionReviewDiv').style.display = 'block';
    updateSessionPreview();
}

function editSession () {
    document.getElementById('previewSessionBtn').style.display = 'inline-block';
    document.getElementById('editSessionBtn').style.display = 'none';
    document.getElementById('submitSessionBtn').style.display = 'none';
    document.getElementById('sessionScheduleDiv').style.display = 'block';
    document.getElementById('sessionReviewDiv').style.display = 'none';
}

function updateSessionPreview () {
    var formData = getFormData();
    document.getElementById('sessionTargetDuration').innerText = formData.scheduledTimeString;
    document.getElementById('scheduledSessionTopic').innerText =  formData.topic;
    document.getElementById('sessionDatePreview').innerText = new Date(formData.date).toDateString();
    document.getElementById('scheduledSessionMissions').innerHTML = '';
    document.getElementById('scheduledSessionCommentsPreview').innerText = formData.comments;
    formData.missions.forEach((mission) => {
        let li = document.createElement('li');
        li.appendChild(document.createTextNode(mission.mission));
        li.classList.add('scheduledSessionMissionLi')
        document.getElementById('scheduledSessionMissions').appendChild(li);
    })
}

function getFormData () {
    let formData = {};
    formData.date = Date.parse(document.getElementById('sessionDate').value);
    if(formData.date < new Date()) return alert('Why do you want to schedule a session in the past?');
    var radios = document.getElementsByName('sessionTopic');
    let hours = document.getElementById('hoursInput').value;
    let minutes = document.getElementById('minutesInput').value;
    let seconds = document.getElementById('secondsInput').value;
    hours = ( hours<10 ? "0" : "" ) + hours;
    minutes = ( minutes<10 ? "0" : "" ) + minutes;
    seconds = ( seconds<10 ? "0" : "" ) + seconds;
    formData.scheduledTimeString = `${hours}:${minutes}:${seconds}`;
    formData.totalMiliseconds = hours * 60 * 60 * 1000 + minutes * 60 * 1000 + seconds * 1000;

    for (var i=0; i<radios.length; i++){
        if(radios[i].checked) formData.topic = radios[i].value;
    }
    var missions = [];
    var missionsTable = document.getElementById('sessionMissionsTable');
    //THis is extremely dangerous code, if the table order gets changed it won't work.
    for (var i = 0, row; row=missionsTable.rows[i] ; i++){
        missions.push ({
          mission : row.cells[0].innerText
        });
    }

    formData.missions = missions;
    formData.comments = document.getElementById('scheduledSessionComments').value;
    return formData;
}

function addMissionTag() {
    let newMission = document.getElementById('sessionMission').value;
    if(newMission) {
        var tableBody = document.getElementById('sessionMissionsTableBody');
        var row = tableBody.insertRow(tableBody.length);
        document.getElementById('sessionMission').value = "";
        row.classList.add('missionRow');
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        cell2.addEventListener('click', () => {
          if(confirm('Are you sure you want to delete this mission?')) row.remove()
        })
        cell1.innerHTML = newMission;
        cell2.innerHTML = '<p class="deleteMission">🗑️</p>'
        cell2.classList.add('deleteMissionCell')
        return newMission
    } else alert('Please enter a mission that exists!')

}