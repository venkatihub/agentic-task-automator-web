const mongoose = require('mongoose');
require('dotenv').config();
const Template = require('./TemplateModel');

const templates = [
  {
    component: 'contact_form',
    templateName: 'contact_form_v1',
    html: `
      <form id="contactForm">
        <input type="text" name="name" placeholder="Your Name" required />
        <input type="email" name="email" placeholder="Your Email" required />
        <button type="submit">Submit</button>
      </form>
    `,
    css: `
      #contactForm { display: flex; flex-direction: column; gap: 10px; width: 300px; }
      #contactForm input, #contactForm button { padding: 10px; }
    `,
    js: `
      document.getElementById('contactForm').addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Form Submitted!');
      });
    `,
    dependencies: [],
  },
  {
    component: 'modal',
    templateName: 'modal_v1',
    html: `
      <div id="myModal" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:white; padding:20px;">
        <p>This is a modal</p>
        <button id="closeModal">Close</button>
      </div>
    `,
    css: '',
    js: `
      document.getElementById('myModal').style.display = 'block';
      document.getElementById('closeModal').addEventListener('click', function() {
        document.getElementById('myModal').style.display = 'none';
      });
    `,
    dependencies: [],
  }
];

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connection.once('open', async () => {
  console.log('Mongo connected, seeding templates...');
  await Template.deleteMany({});
  await Template.insertMany(templates);
  console.log('Templates seeded!');
  process.exit(0);
});
