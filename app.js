const express = require("express");
const bodyParser = require("body-parser");
const fs = require('fs');
const path = require('path');

const app = express();
let registrations = [];

// File path for registration data
const dataFilePath = path.join(__dirname, 'registrations.json');

// File path for feedback data
const feedbackDataFile = path.join(__dirname, 'feedback.json');

// Load existing registration data from the JSON file
fs.readFile(dataFilePath, 'utf8', (err, data) => {
  if (!err) {
    registrations = JSON.parse(data);
  }
});

app.use(bodyParser.urlencoded({ extended: true }));// Use url-encoded data
app.use(express.static('public'));
app.use(express.json());

app.set('views', './views');
app.set('view engine', 'ejs');

// Route to render the first page
app.get('/', (req, res) => {
  res.render(__dirname + '/views/first_page.ejs', { registrations });
});

// Route to render the second page
app.get('/second_page', (req, res) => {
  res.render(__dirname + '/views/second_page.ejs');
});

// Route to render the registration page
app.get('/registrace', (req, res) => {
  res.render(__dirname + '/views/registrace.ejs');
});

// REST API endpoint to check if a nickname exists
app.get('/api/check-nickname/:nick', (req, res) => {
  const nickToCheck = req.params.nick;

  // Check if the nickname exists in the registrations array
  const existingRegistration = registrations.find((registration) => registration.nick === nickToCheck);
  if (existingRegistration) {
    res.status(200).json({ exists: true, registration: existingRegistration });
  } else {
    res.status(200).json({ exists: false });
  }
});

// Handle the registration form POST request
app.post('/submit-registration', (req, res) => {
  const nick = req.body.nick;
  const je_plavec = req.body.je_plavec;
  const kanoe_kamarad = req.body.kanoe_kamarad;
  const jméno = req.body.jméno;
  const příjmení = req.body.příjmení;
  const třída = req.body.třída;

  // Check if a registration with the same nickname already exists
  const existingRegistration = registrations.find((registration) => registration.nick === nick);

  if (existingRegistration) {
    return res.status(400).send('Nickname already exists. Choose a different nickname.');
  }

  // Validate je_plavec
  if (je_plavec !== '1' && je_plavec !== '0') {
    return res.status(400).send('Invalid value for "je_plavec". Must be "1" for Ano or "0" for Ne.');
  }

  // Validate nick
  const nickPattern = /^[a-zA-Z0-9]{2,20}$/;
  if (!nick.match(nickPattern)) {
    return res.status(400).send('Invalid value for "nick". It should contain 2 to 20 alphanumeric characters.');
  }

  // Validate kanoe_kamarad
  if (kanoe_kamarad) {
    if (!kanoe_kamarad.match(nickPattern)) {
      return res.status(400).send('Invalid value for "kanoe_kamarad". It should match the same criteria as "nick".');
    }
  }

  // Add the registration to the array
  registrations.push({
    nick,
    je_plavec: je_plavec === '1' ? 'Ano' : 'Ne',
    kanoe_kamarad: kanoe_kamarad || 'N/A',
    jméno,
    příjmení,
    třída,
  });

  // Save the updated registrations array to the JSON file
  fs.writeFile(dataFilePath, JSON.stringify(registrations, null, 2), (err) => {
    if (err) {
      console.error('Error saving registration data:', err);
    } else {
      console.log('Registration data saved successfully.');
    }
  });

  // Return a success message
  return res.status(200).send('Registration successful.');
});

// Handle the feedback form POST request
app.post('/submit-feedback', (req, res) => {
  const feedback = req.body.feedback;
  const rating = req.body.rating;

  // Validate feedback
  if (!feedback || feedback.trim() === '') {
    return res.status(400).send('Feedback is required.');
  }

  // Create an object to store feedback data
  const feedbackData = {
    feedback,
    rating,
    timestamp: new Date(),
  };

  // Load existing feedback data from the file, or create an empty array if the file doesn't exist
  let existingData = [];
  try {
    existingData = JSON.parse(fs.readFileSync(feedbackDataFile));
  } catch (err) {
    // File might not exist yet
  }

  // Add the new feedback data to the array
  existingData.push(feedbackData);

  // Save the updated data back to the file
  fs.writeFileSync(feedbackDataFile, JSON.stringify(existingData, null, 2));

  res.status(200).send('Feedback submitted successfully.');
});

// Start the server
const server = app.listen(22102, () => {
  console.log("Listening on port 22102");
});
