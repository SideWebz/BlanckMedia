const form = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');
const submitButton = form.querySelector('button[type="submit"]');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Bootstrap/HTML5 validation
  if (!form.checkValidity()) {
    form.classList.add('was-validated'); // triggers red borders + error messages
    return; // stop -> do not submit
  }

  formMessage.textContent = '';
  formMessage.classList.remove('text-success', 'text-danger');

  const formData = {
    company: form.company.value,
    name: form.name.value,
    email: form.email.value,
    message: form.message.value
  };

  try {
    const res = await fetch('/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      formMessage.textContent = 'Your message has been sent successfully!';
      formMessage.classList.add('text-success');
      submitButton.style.display = 'none';
      form.reset();
      form.classList.remove('was-validated'); // reset styling
    } else {
      const errorText = await res.text();
      formMessage.textContent = `Something went wrong: ${errorText}`;
      formMessage.classList.add('text-danger');
      submitButton.style.display = 'none';
    }

  } catch(err) {
    console.error(err);
    formMessage.textContent = 'An error occurred while sending your message.';
    formMessage.classList.add('text-danger');
    submitButton.style.display = 'none';
  }
});
