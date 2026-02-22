const express = require('express');
const path = require('path');
const session = require('express-session');
const config = require('../config');
const authRoutes = require('./routes/auth');
const dashRoutes = require('./routes/dashboard');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: config.app.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', secure: false },
  })
);

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(authRoutes);
app.use('/dashboard', dashRoutes);

app.get('/', (req, res) => {
  res.render('index', { user: req.session.user || null });
});

app.listen(config.app.port, () => {
  console.log(`✅ Dashboard running at http://localhost:${config.app.port}`);
});
