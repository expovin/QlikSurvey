var express = require('express');
var secret = require('../secret');
var conv = require("../conversations");
var SkillBot = require('../lib/skillBot');
var log = require('../lib/logHandler');
var repo = require('../lib/repoHandler');
var conversation = require('../lib/conversation');
var hlp = require('../lib/helper');
var excelFile = require('../lib/excelFile');

var router = express.Router();

log.info("Starting Bot");
const db = new repo(secret.Repository);
var BOTToken = new SkillBot({token : secret.BOTToken.token, 
                            name: secret.BOTToken.name}, 
                            db);


const cv = new conversation(BOTToken, db);



/* GET users listing. */
router.route('/')
.get(function(req, res, next) {
    res.json({status:'OK'});
  });


router.route('/sendMessage/interactive')
.post(function (req, res, body){
    var payload = JSON.parse(req.body.payload);
    //res.status(200).json();
    if(payload.token === secret.BOTToken.VerificationToken){
        log.info("Received valid interactive response. Token verified!");
        log.info("Interactive component req : ", payload);
        

        db.setComunicationInProgress(payload.user.id, false)
        .then(  result => {
            log.debug("set Flag Comunication terminated ",result);
        })

        cv.handleResponse(payload)
        .then( (response) =>{
            log.info("Comunication complete!");
            res.status(200).json(response);
        })
        .catch( error =>{
            log.error("Error handling the user interactive response :",error);
        })
        
    }
})


router.route('/happiness')
.get(function(req, res, next) {

    var _users;
    var _message;

    db.getUsers(true)

    .then( users => {
        _users=users;
        return db.getFirstTaskMessage(0)
    })
    .then( result => {
        _message=result.message;
        return db.getTaskAttechments(0);
    })
    .then( attach =>{
        return cv.askForHappiness(_users, _message, attach);
    } )
    .then ( result =>{
        res.json(result);
    })
    .catch( error =>{
        log.error("Error in happiness chain ",error);
        res.json(error);
    })
})

router.route('/test')
.get(function(req, res, next) {
    db.getTaskAttechments(0)
    .then( data =>{
        res.json(data);
    })
    .catch( error => {
        res.json(error);
    })
})



module.exports = router;
