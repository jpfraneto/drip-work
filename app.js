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

mongoose.connect(process.env.DATABASE_URL, {
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

if(process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
      if (req.header('x-forwarded-proto') !== 'https')
        res.redirect(`https://${req.header('host')}${req.url}`)
      else
        next()
    })
}

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
    if(req.user) {
        User.findOne({username : req.user.username}).populate('workSessions')
        .then((thisUser) => {
            let scheduledSessions = thisUser.workSessions.filter(x => x.scheduled);
            console.log(scheduledSessions);
            res.render('index', {scheduledSessions : scheduledSessions})
        })
    }
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
        User.findOne({username:req.user.username}).populate('workSessions').populate('afterStats')
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

app.post('/startNewSession', (req, res) => {
    User.findOne({username:req.user.username})
    .then((thisUser) => {
        let newSession = new WorkSession({
            index : thisUser.workSessions.length,
            targetDuration : req.body.targetDuration,
            scheduled : false,
            missions : req.body.missions,
            comments : req.body.comments,
            realStartingTimestamp : req.body.startingTimestamp
        });
        newSession.save();
        thisUser.workSessions.push(newSession);
        thisUser.save();
        res.json({sessionID:newSession._id});
    });
});

app.post('/endSession', (req, res) => {
    WorkSession.findById({_id:req.body.sessionID})
    .then((thisSession)=>{
        req.body.sessionMissions.forEach((sessionMission) => {
            for (let i = 0; i < thisSession.missions.length ; i++) {
                if (thisSession.missions[i].mission === sessionMission.mission) {
                    thisSession.missions[i].completed = sessionMission.completed;
                    thisSession.missions[i].missionComments = sessionMission.missionComments;
                }
            }
        })
        thisSession.realDuration = req.body.sessionDuration;
        thisSession.afterStats.feelingRating = req.body.feelingRating;
        thisSession.afterStats.afterComments = req.body.comments;
        thisSession.rating = calculateSessionRating(thisSession.afterStats.feelingRating, thisSession.targetDuration, thisSession.realDuration)
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
    WorkSession.findById(req.body.sessionID).populate('afterStats')
    .then((queriedSession) => {
        console.log(queriedSession);
        res.json({sessionComments : queriedSession.afterStats.afterComments})
    })
})

app.post('/getSessionMissions', (req, res) => {
    WorkSession.findById(req.body.sessionID)
    .then((queriedSession) => {
        res.json({sessionMissions : queriedSession.missions})
    })
})

app.post('/getSessionInformation', (req, res) => {
    WorkSession.findById(req.body.sessionID)
    .then((queriedSession) => {
        res.json({queriedSession})
    })
})

app.get('/schedule', (req, res) => {
    if(req.user) res.render('schedule');
    else res.redirect('login');
})

app.post('/schedule', (req, res) => {
    User.findOne({username:req.user.username})
    .then((thisUser) => {
        let newSession = new WorkSession({
            targetDuration : req.body.targetDuration,
            scheduled : true,
            missions : req.body.missions,
            comments : req.body.comments,
            scheduledStartingDate : req.body.date
        });
        newSession.save();
        thisUser.workSessions.push(newSession);
        thisUser.save();
        res.json({message:'the session was scheduled on the user'});
    });
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server started on port: http://localhost:${port}`);
})

function calculateSessionRating(feelingRating, targetDuration, realDuration){
    return (0,1*((feelingRating*3/100) + (realDuration*7/targetDuration)))
}
