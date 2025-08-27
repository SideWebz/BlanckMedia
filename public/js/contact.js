const form = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');
const submitButton = form.querySelector('button[type="submit"]');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  formMessage.textContent = ''; // oude messages weg
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
      submitButton.style.display = 'none'; // knop verbergen
      form.reset();
    } else {
      const errorText = await res.text();
      formMessage.textContent = `Er is iets fout gegaan: ${errorText}`;
      formMessage.classList.add('text-danger');
      submitButton.style.display = 'none'; // knop ook verbergen bij fout
    }

  } catch(err) {
    console.error(err);
    formMessage.textContent = 'Er is iets fout gegaan bij het verzenden.';
    formMessage.classList.add('text-danger');
    submitButton.style.display = 'none'; // knop verbergen bij fout
  }
});
