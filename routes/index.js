var express = require('express');
var router = express.Router();
const crypto = require("crypto");

const bodyParser = require("body-parser");

function random(lower, upper) {
    return Math.floor(Math.random() * (upper - lower)) + lower;
}
function Hash(str){
    let password = str;
    let md5 = crypto.createHash("md5");
    let newPas = md5.update(password).digest("hex");
    return newPas;
}

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017";

/* GET home page. */
router.get('/', function(req, res, next){
    if (req.session.sign){
        res.render('profile', {title: "Profile"});
    }else res.render('index', { title: 'Index' });
});

router.post('/', function(req, res, next){
    console.log("post get");
    if (req.session.sign){
        res.render('profile', {title: "Profile"});
    }
    else if (req.body.username != "" && req.body.password != ""){
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            console.log("Success connect");

            var dbo = db.db("user");
            var where = {username: req.body.username};

            dbo.collection("account").find(where).toArray(function(err, result) {
                if (err) throw err;
                console.log(result[0]);
                if (result == "") res.render('index', {error: 'No such user'});
                else {
                    var pass = Hash(req.body.password);
                    if (pass != result[0].password) res.render('index', {error: 'Wrong username or password'});
                    else {
                        req.session.sign = true;
                        req.session.UID = result[0].UID;
                        req.session.username = result[0].username;
                        res.render('profile', {title: "Profile"});
                    }
                }
                console.log("Finish");
                db.close();
            });
        });
    }else res.render('index', {error: 'Please fill in the Username and Password'});
});

/* GET signout page. */
router.get('/signout', function(req, res, next) {
    req.session.sign = false;
    req.session.UID = 0;
    req.session.username = 0;
    res.render('signout');
});

/* GET Profile page. */
router.get('/profile', function(req, res, next) {
    if (req.session.sign) {

    }else{
        res.render('index');
    }
    console.log(req.session.UID);
    res.render('profile', { title: 'Profile' });
});

/* GET Career page. */
router.get('/career', function(req, res, next) {
    if (req.session.sign) {

    }else{
        res.render('index');
    }
    console.log(req.session.UID);
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        console.log("Success connect");

        var dbo = db.db("user");
        var where = {username: req.session.username};
        var mysort = { win: -1 };
        dbo.collection("account").find().sort(mysort).toArray(function(err, sortres) {
            if (err) throw err;
            console.log(sortres);
            req.session.Sort = sortres;
            dbo.collection("account").find(where).toArray(function(err, result) {
                if (err) throw err;
                console.log(result[0]);
                if (result == "") res.render('index', {error: 'No such user'});
                else res.render('career', { title: 'Career' , tot: result[0].tot, win: result[0].win, username: req.session.username});

                console.log("Finish");
                db.close();
            });

        });

    });

});

/* GET Game page. */
router.get('/game', function(req, res, next) {
    res.render('game', { title: 'Game' });
});

router.use(bodyParser.urlencoded({
    extended: false
}));

router.use(bodyParser.json());

/* Post Profile page. */
router.post('/profile', function(req, res, next) {
    res.render('profile', { title: 'Profile' });
});

/* GET register page. */
router.get('/register', function(req, res, next) {
    res.render('register', { title: 'Register' });
});

router.post("/register", function (req, res) {
    console.log(req.body.password);
    req.body.password = Hash(req.body.password);
    delete req.body.confirm;
    req.body.UID = "user#" + random(0, 100000000);
    req.body.tot = 0;
    req.body.win = 0;
    console.log(req.body);
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        console.log("Success connect");

        var dbo = db.db("user");
        var where = {username: req.body.username};

        dbo.collection("account").find(where).toArray(function(err, result) {
            if (err) throw err;
            console.log(result[0]);
            if (result == "") {
                dbo.collection("account").insertOne(req.body,function(err, result) {
                    if (err) throw err;
                    console.log("Inserted !");
                    db.close();
                    res.render("register_success", {title: "register_success"});
                })
            }
            else {
                res.render('register', { title: 'Register' , error: "Username exists! Please choose another one."});
                db.close();
            }
        });
    });
});


/* GET register_success page. */
router.get('/register_success', function(req, res, next) {
    res.render('register_success');
});

/* GET register_success page. */
router.get('/over', function(req, res, next) {
    res.render('over', {result: req.session.result});
});

/* GET test page. */
router.get('/test', function(req, res, next) {
    res.render('test');
});


module.exports = router;
