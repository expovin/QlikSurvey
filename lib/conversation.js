'use strict'
var cfg = require('../config');
var log = require('../lib/logHandler');
var msg = require('../conversations');
var convPath = require('./conversationalPath');
var cloner = require('cloner');

var _db;
var _neo;
var _this;

var dismissButton = {
    name : "Dismiss",
    text : "Dismiss",
    type : "button",
    value: "Dismiss",
    style: "danger"
}

log.info("Set default lang for Messages : eng");
var message = "eng";

class conversation {

    constructor(bot, db){
        _neo=bot;
        _db=db;
    }


    askForHappiness(users, message, attachments){
        var promises=[];
        var count=0;

        log.debug("Start askForHappiness on ",users.length," users");
        log.trace("They are : ",users);
        log.trace("Message : ",message);
        log.trace("Attachments : ",attachments);

        return new Promise (function (fulfill, reject){

            /****************** SET INTERVAL TO AVOID SUB-SECOND API REUEST ********************/
            var interval = setInterval ( function(){
                if(users[count].trigram !== null){
                    log.debug("Ask how is happy to : ",users[count].trigram);

                    promises.push(
                        _neo.postMessage(users[count].USERID, message, true, attachments)
                        .then( result =>{
                            fulfill(result);
                        })
                    )
                }
                count++;
                if(count >= users.length) clearInterval(interval);
            }, cfg.botSettings.TimeBetweenCalls)
            /********************************************************************************* */

            Promise.all(promises)
            .then( () =>{
                log.trace("Asked to users relevant words for skill");
                fulfill("Asked all users for set their trigram");
            })

        })
    }


    handleResponse(response)
    {
        log.debug("HandleResponse ",response);
        var nextAction=response.callback_id;
        var result=response.actions[0].name;
        var _user;
        var _message;
        _db.getTrigramFromUserId(response.user.id)
        .then( user =>{
            log.debug("From user: ",user);
            _user=user;
            return _db.getQuestionFromAnswere(response.actions[0].name, response.attachment_id)
        })
        .then( question =>{
            log.debug("Domanda relativa alla risposta : ",question.text);
            log.debug("Risposta da memorizzare nel DB: ",result);
            return _db.saveSurveyAnswer(response.actions[0].name, question.text, result, _user)
        })
        .then( idResponse =>{
            log.info("Response added with the ID : ",idResponse.ID);
            log.debug("NextAction",nextAction);
            return _db.getNextActionMessage(nextAction)
        .then ( message =>{
            _message=message.message;

            if(message.type === 0){
                // Get attachments
                log.debug("Next action is an Attachments");
                return _db.getTaskAttechments(nextAction)
            }
            else {
                // Get dialog
                log.debug("Next action is a Dialog");
                return _db.getElementsDialog(nextAction)
            }
            
        })
        .then ( result => {

            if(_message.type === 0){
                log.debug("Send Netxt attachments");
                return new Promise (function (fulfill, reject){
                    var body = {
                        channel : response.channel.id,
                        text : text,
                        as_user : true, 
                        attachments : result,
                        icon_emoji :null,
                        icon_url : null,
                        link_names : null,
                        parse : "none",
                        reply_broadcast : null,
                        thread_ts : response.message_ts,
                        unfurl_links : null,
                        unfurl_media : null,
                        username : null
                    }
        
    
                    log.debug("Interactive response");
                    _neo.interactiveResponse(  response.response_url , body, false )
                    .then( r =>{
                        log.trace("Request sent, response: ",r);
                        log.debug("Eventuale post action")
                        //action.PostAction(r,response);
                    })
                    .catch( error =>{
                            reject(error);
                    })
                    
                })
            }
            else {
                log.debug("Open Dialog");
                _neo.openDialog(  result , response)
                .then( r =>{
                    log.trace("Request sent, response: ",r);
                    log.debug("Eventuale post action")
                    //action.PostAction(r,response);
                })
                .catch( error =>{
                        reject(error);
                })
            }
        })

            /**
             * Need to get the Message from the Next Action
             * Check whether the next action contain attachment or dialog
             * Need to get the attachments/dialogs from the next action
             * Send back the interactiveResponse
             */



        })
        
    }
}


module.exports = conversation;