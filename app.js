require('dotenv').config()

const express        = require('express');
var app              = express();
const bodyParser     = require('body-parser');
const ejs            = require('ejs');
const mongoose       = require('mongoose');
const passport       = require('passport');
const LocalStrategy  = require('passport-local');
const session        = require('express-session');
const User           = require('./models/user.js');
const flash          = require('connect-flash');
const WorkSession        = require('./models/workSession.js');


var mongoDB = 'mongodb+srv://jpfraneto:marisol@deepwork.ady8x.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
mongoose.connect(mongoDB, {
    useNewUrlParser: true, 
    useUnifiedTopology: true, 
    useCreateIndex: true, 
    useFindAndModify: false
});

app.use(express.json());
app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: true}));
app.use(express.static('public'));
app.use(flash());

const sessionConfig = {
    secret : 'wenaCompare!',
    resave : false,
    saveUninitialized : true,
    cookie : {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    } 
}

app.use(session(sessionConfig));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
})

app.get('/', (req, res) => {
    if(req.user) res.render('index');
    else res.redirect('login');
})

app.get('/login', (req, res) => {
    res.render('login');
})

app.post('/login', passport.authenticate('local', {failureFlash: true, failureRedirect: '/login'}), (req, res) => {
    res.redirect('/');
})

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
})

app.get('/register', (req, res) => {
    res.render('register');
})
 
app.post('/register', async (req, res) => {
    try {
        const {email, username, password} = req.body;
        const user = new User({email, username});
        const registeredUser = await User.register(user, password);
        res.redirect('/');
    } catch(e) {
        res.redirect('/register')
    }
});

app.get('/users/:username', async (req, res) => {
    if(req.user){
        User.findOne({username:req.user.username}).populate('workSessions')
        .then((thisUser) => {
            if(req.params.username === req.user.username){
                var averageRating = thisUser.workSessions.reduce((acc, val) => acc + val.rating, 0) / thisUser.workSessions.length;
                res.render('users/show', {userInfo : thisUser, averageRating : averageRating});
            } else {
                res.redirect('/login');
            }
        })
    } else {
        res.redirect('/login');
    }
})

app.post('/newSession', (req, res) => {
    User.findOne({username:req.body.username})
    .then((thisUser) => {
        let newSession = new WorkSession({
            index : thisUser.workSessions.length,
            targetDuration : req.body.targetDuration,
            mission : req.body.mission,
            realStartingTimestamp : req.body.startingTimestamp
        });
        newSession.save();
        thisUser.workSessions.push(newSession);
        thisUser.save();
        console.log('The new session started');
        res.json({sessionID:newSession._id});
    });
});

app.post('/endSession', (req, res) => {
    WorkSession.findById({_id:req.body.sessionID})
    .then((thisSession)=>{
        thisSession.afterStats.duration = req.body.sessionDuration;
        thisSession.rating = req.body.feelingRating;
        thisSession.afterStats.comments = req.body.comments;
        thisSession.save(()=>{
            res.json({message:'The session was saved in your profile. Keep it going!'})
            if(req.user){
                User.findById(req.user._id)
                .then((thisUser) => {
                    thisUser.elapsedTimeWorking += parseInt(req.body.sessionDuration);
                    thisUser.save();
                })
            }
        });
    })
});

app.post('/getSessionComment', (req, res) => {
    console.log(req.body.sessionID);
    WorkSession.findById(req.body.sessionID).populate('afterStats')
    .then((queriedSession) => {
        console.log(queriedSession);
        res.json({sessionComments : queriedSession.afterStats.comments})
    })
})

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const port = 3000;
app.listen(port, () => {
    console.log(`Server started on port: http://localhost:${port}`);
})