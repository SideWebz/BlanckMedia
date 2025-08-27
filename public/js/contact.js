const form = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');
const submitButton = form.querySelector('button[type="submit"]');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Bootstrap/HTML5 validatie
  if (!form.checkValidity()) {
    form.classList.add('was-validated'); // triggert de rode randjes + foutmeldingen
    return; // stop -> niet versturen
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
      formMessage.textContent = 'Uw bericht is succesvol verstuurd!';
      formMessage.classList.add('text-success');
      submitButton.style.display = 'none';
      form.reset();
      form.classList.remove('was-validated'); // reset styling
    } else {
      const errorText = await res.text();
      formMessage.textContent = `Er is iets fout gegaan: ${errorText}`;
      formMessage.classList.add('text-danger');
      submitButton.style.display = 'none';
    }

  } catch(err) {
    console.error(err);
    formMessage.textContent = 'Er is iets fout gegaan bij het verzenden.';
    formMessage.classList.add('text-danger');
    submitButton.style.display = 'none';
  }
});
