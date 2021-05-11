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