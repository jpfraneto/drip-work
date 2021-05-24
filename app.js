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
const MusicRecommendation= require('./models/musicRecommendation.js')

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
            res.render('index', {scheduledSessions : scheduledSessions, userTopics: thisUser.topics})
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
                var finishedSessions = thisUser.workSessions.filter(x => !x.scheduled)
                console.log(thisUser);
                res.render('users/show', {userInfo : thisUser, averageRating : averageRating, userTopics : thisUser.topics});
            } else {
                res.redirect('/login');
            }
        })
    } else {
        res.redirect('/login');
    }
})

app.post('/getSessionsByTopic', (req, res) => {
    User.findOne({username:req.user.username}).populate('workSessions')
    .then((foundUser) => {
        if(req.body.fetchedTopic !== "All"){
            let sessionsByTopic = foundUser.workSessions.filter(x => x.topic === req.body.fetchedTopic);
            res.json(sessionsByTopic);
        } else {
            res.json(foundUser.workSessions)
        }
    })
})

app.post('/startSession', (req, res) => {
    User.findOne({username:req.user.username})
    .then((thisUser) => {
        if(req.body.sessionID) {
            WorkSession.findById(req.body.sessionID)
            .then((scheduledSession) => {
                scheduledSession.missions = req.body.missions;
                scheduledSession.realStartingTimestamp = req.body.startingTimestamp;
                scheduledSession.targetDuration = req.body.targetDuration;
                scheduledSession.save();
                console.log('scheduledSession', scheduledSession)
                res.json({sessionID:req.body.sessionID});
            });
        } else {
            let newSession = new WorkSession({
                index : thisUser.workSessions.length,
                targetDuration : req.body.targetDuration,
                scheduled : false,
                missions : req.body.missions,
                comments : req.body.comments,
                topic : req.body.sessionTopic,
                realStartingTimestamp : req.body.startingTimestamp
            });
            newSession.save();
            thisUser.workSessions.push(newSession);
            thisUser.save();
            res.json({sessionID:newSession._id});
        }
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
        thisSession.comments = req.body.sessionComments;
        thisSession.realDuration = Math.min(thisSession.targetDuration, req.body.sessionDuration);
        thisSession.afterStats.feelingRating = req.body.feelingRating;
        thisSession.afterStats.afterComments = req.body.afterSessionComments;
        if(!req.body.scheduled) thisSession.scheduled = false;
        thisSession.rating = calculateSessionRating(thisSession.afterStats.feelingRating, thisSession.targetDuration, thisSession.realDuration)
        thisSession.save(() => {
            console.log('The session that was just saved to the DB is:')
            console.log(thisSession);
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
        res.json({sessionComments : queriedSession.afterStats.afterComments})
    })
})

app.post('/addTopicToUser', (req, res) => {
    console.log('in here');
    console.log(req.body);
    User.findOne({username:req.user.username})
    .then((thisUser) => {
        thisUser.topics.push(req.body.newTopic);
        thisUser.save(()=>{
            console.log('the user was updated with the new topic: ', req.body.newTopic);
            res.json({message:'The topic was successfully added to the user'});
        })
    });
})

app.post('/getSessionInformation', (req, res) => {
    WorkSession.findById(req.body.sessionID)
    .then((queriedSession) => {
        res.json({queriedSession});
    })
})

app.get('/schedule', (req, res) => {
    if(req.user) 
    User.findOne({username:req.user.username})
    .then((thisUser) => {
        console.log(thisUser);
        res.render('schedule', {userTopics : thisUser.topics});
    });
    else res.redirect('login');
})

app.post('/schedule', (req, res) => {
    User.findOne({username:req.user.username})
    .then((thisUser) => {
        let newSession = new WorkSession({
            targetDuration : req.body.targetDuration,
            scheduled : true,
            topic : req.body.topic,
            missions : req.body.missions,
            comments : req.body.comments,
            scheduledStartingDate : req.body.date
        });
        newSession.save();
        thisUser.workSessions.push(newSession);
        thisUser.save();
        res.json({message:'Your new session was scheduled'});
    });
})

app.get('/addmusic', (req, res) => {
    if(req.user.username === 'jpfraneto'){
        res.render('addmusic')
    } else {
        console.log('you are not admitted here!');
        res.redirect('/');
    }
})

app.post('/addMusic', (req, res) => {
    if(req.body.youtubeID.length === 11) {
        let newMusic = new MusicRecommendation({youtubeID:req.body.youtubeID})
        newMusic.save(()=>{
            console.log('The video with the following youtubeID was saved to the DB: ', req.body.youtubeID);
            res.redirect('/');
        })
    } else {
        console.log('That is not a valid youtube id!');
        res.redirect('/');
    }
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server started on port: http://localhost:${port}`);
})

function calculateSessionRating(feelingRating, targetDuration, realDuration){
    if(targetDuration<realDuration) return 0,1*(feelingRating*3/100);
    return (0,1*((feelingRating*3/100) + (realDuration*7/targetDuration))).toFixed(2);
}
