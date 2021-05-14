window.onload = () => {
    document.getElementById('addTopicBtn').addEventListener('click', addTopic);
    document.getElementById('addMissionBtn').addEventListener('click', addMission);
    document.getElementById('previewSessionBtn').addEventListener('click', previewSession);
    document.getElementById('editSessionBtn').addEventListener('click', editSession);

    document.getElementById('scheduleSessionForm').addEventListener('submit', (e) => {
        e.preventDefault();
        var date = document.getElementById('sessionDate').value;
        var radios = document.getElementsByName('sessionTopic');
        let hours = document.getElementById('hoursInput').value;
        let minutes = document.getElementById('minutesInput').value;
        let seconds = document.getElementById('secondsInput').value;
        var totalMiliseconds = hours * 60 * 60 * 1000 + minutes * 60 * 1000 + seconds * 1000;

        for (var i=0; i<radios.length; i++){
            if(radios[i].checked) var topic = radios[i].value;
        }
        var missions = [];
        var missionsUl = document.getElementsByClassName('missionLi');
        for (var i = 0; i<missionsUl.length ; i++){
            missions.push(missionsUl[i].innerHTML)
        }
        var query = {
            date : date,
            topic : topic,
            missions : missions,
            targetDuration : totalMiliseconds
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
              console.log(data);
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
    addTopicTag();
}

function addTopicTag() {
    let newTopic = document.getElementById('otherTopic').value;
    var radioHtml = '<input id="'+newTopic+'" type="radio" name="sessionTopic" checked="checked"/>';
    var labelHtml = '<label for="'+newTopic+'">'+ newTopic+'</label>'
    var radioFragment = document.createElement('div');
    radioFragment.innerHTML = radioHtml + " " + labelHtml;
    document.getElementById('topicSelection').appendChild(radioFragment);
}

function addMissionTag() {
    let newMission = document.getElementById('sessionMission').value;
    let li = document.createElement('li');
    li.appendChild(document.createTextNode(newMission));
    li.classList.add('missionLi');
    document.getElementById('sessionMissions').appendChild(li);
    document.getElementById('sessionMission').value = "";
    return newMission
}

function previewSession () {
    document.getElementById('previewSessionBtn').style.display = 'none';
    document.getElementById('editSessionBtn').style.display = 'inline-block';
    document.getElementById('submitSessionBtn').style.display = 'inline-block';
    document.getElementById('sessionScheduleDiv').style.display = 'none';
    document.getElementById('sessionReviewDiv').style.display = 'block';
}

function editSession () {
    document.getElementById('previewSessionBtn').style.display = 'inline-block';
    document.getElementById('editSessionBtn').style.display = 'none';
    document.getElementById('submitSessionBtn').style.display = 'none';
    document.getElementById('sessionScheduleDiv').style.display = 'block';
    document.getElementById('sessionReviewDiv').style.display = 'none';
}