'use strict'
var mysql = require('mysql');
var log = require('../lib/logHandler');

class Repo {
    constructor (connection) {
        this.con = mysql.createConnection({
            host: connection.host,
            user: connection.user,
            password: connection.password
        });

        this.con.connect(function(err) {
            if (err){
                log.error("Connection error : ",err);
                log.error("Connection parameters : ",connection);
                throw err;
            } 

            log.info("Connected to the Database");
        });
    }



    addNewHappyRank(country, rank,word){
        log.trace("Adding new Happiness rank Country :",country, " rank: ",rank, "word: ",word);

        var sql = "insert into Neo.happiness (Country, Rank, word) values ('"+country+"',"+rank+",'"+word+"')";
        var _this = this;

        return new Promise(function (fulfill, reject){
            log.trace("Query :",sql);
            _this.con.query( sql, (err, result)=>{
                if(err) {
                    log.warn("Error while adding new happiness rank : ",err);
                    reject(err);
                }

                log.info("New happiness rank has been added");
                fulfill({Code: 200, Message : 'New happiness rank has been added'});
            })
        })
    }


    setOldest(channelId, oldest){
        log.trace("Set latest message read ",oldest," for channel ",channelId);

        /** Convert Unix time to Date */
        var oldestDate = new Date(oldest*1000);
        var day = "0" + oldestDate.getUTCDate();
        var month = "0" + (oldestDate.getUTCMonth()+1);
        var year = oldestDate.getUTCFullYear();
        var hours = "0" + oldestDate.getHours();
        var minutes = "0" + oldestDate.getMinutes();
        var seconds = "0" + oldestDate.getSeconds();

        var oldestCompleteDate = day.substr(-2)+"/"+month.substr(-2)+"/"+year+" "
                                +hours.substr(-2)+":"+minutes.substr(-2)+":"+seconds.substr(-2);
        /*************************** */

        var sql = "UPDATE Neo.Channels set oldest=STR_TO_DATE('"+oldestCompleteDate+"','%d/%m/%Y %H:%i:%s'), lastCheck=Now() WHERE ChannelID='"+channelId+"'";
        var _this = this;
        return new Promise (function (fulfill, reject){
            log.trace("Query :",sql);
            _this.con.query( sql, (err, result)=>{
                if(err) {
                    log.error("Error while setting oldest for Channal ",channelId," in repository");
                    reject(err);
                } 
                log.info("New oldest set for channel ",channelId);
                fulfill({Code: 200, Message : 'Oldest set for channelId'+channelId});
            })
        })
    }



    getUserInfo(me){
        log.trace("Get all infos for user ",me);

        var select = "SELECT * FROM Neo.USERS where USERID='"+me+"'";

        var _this = this;
        return new Promise(function (fulfill, reject){
            log.error("Query :",select);
            _this.con.query( select, (err, result)=>{
                if(err) {
                    log.warn("Error while getting Users from repository");
                    reject(err);
                }
                var Users=[];
                result.forEach( function(tuple){
                    var User={};
                    User['USERID']=tuple.USERID;
                    User['slackUser']=tuple.slackUser;
                    User['trigram']=tuple.trigram;
                    User['name']=tuple.name;
                    User['update']=tuple.update;
                    User['isTester']=tuple.isTester;
                    User['isAdmin']=tuple.isAdmin;
                    User['isSkillUser']=tuple.isSkillUser;
                    User['isHelper']=tuple.isHelper;
                    User['Score']=tuple.Score;
                    User['isGreeted']=tuple.isGreeted;
                    User['lastConversationURL']=tuple.lastConversationURL;
                    User['default_lang']=tuple.default_lang;
                    User['comunicationInProgress']=tuple.comunicationInProgress;
                    Users.push(User);
                })
                fulfill(Users);
            })
        })

    }

    getUsers(isTester, isAdmin){
        var restrict="";
        log.trace("get the list of users from Repo. SurveyTester: ",isTester," isAdmin: ",isAdmin);

        if(isTester)
            restrict = restrict+" AND SurveyTester=1";

        if(isAdmin)
            restrict = restrict+" AND isAdmin=1";

        var select = "SELECT * FROM Neo.USERS where isSkillUser=1"+restrict;

        var _this = this;
        return new Promise(function (fulfill, reject){
            log.trace("Query :",select);
            _this.con.query( select, (err, result)=>{
                if(err) {
                    log.warn("Error while getting Users from repository");
                    reject(err);
                }
                var Users=[];
                result.forEach( function(tuple){
                    var User={};
                    User['USERID']=tuple.USERID;
                    User['slackUser']=tuple.slackUser;
                    User['trigram']=tuple.trigram;
                    User['name']=tuple.name;
                    User['update']=tuple.update;
                    User['isTester']=tuple.isTester;
                    User['isAdmin']=tuple.isAdmin;
                    User['isSkillUser']=tuple.isSkillUser;
                    User['isHelper']=tuple.isHelper;
                    User['Score']=tuple.Score;
                    User['isGreeted']=tuple.isGreeted;
                    User['lastConversationURL']=tuple.lastConversationURL;
                    User['default_lang']=tuple.default_lang;
                    User['comunicationInProgress']=tuple.comunicationInProgress;
                    Users.push(User);
                })
                fulfill(Users);
            })
        })
    }


    getTrigramFromUserId(Userid){
        var select = "SELECT trigram FROM Neo.USERS where USERID='"+Userid+"'";
        var _this = this;
        return new Promise(function (fulfill, reject){
            log.trace("Query :",select);
            _this.con.query( select, (err, result)=>{
                if(err) {
                    log.warn("Error while getting trigram from repository");
                    reject(err);
                }
                log.debug("Return --> ",result[0].trigram);
                fulfill(result[0].trigram);
            })
        })
    }

    getUserIdFromTrigram(trigram){
        var select = "SELECT USERID FROM Neo.USERS where trigram='"+trigram+"'";
        var _this = this;
        return new Promise(function (fulfill, reject){
            log.trace("Query :",select);
            _this.con.query( select, (err, result)=>{
                if(err) {
                    log.warn("Error while getting USERID from repository");
                    reject(err);
                }
                if(result[0])
                    fulfill(result[0].USERID);
                else
                    reject({status:"ok",error:"112",message:"Error, trigram not found"})
            })
        })
    }

    getTrigramFromUserName(UserName){
        var select = "SELECT trigram FROM Neo.USERS where slackUser='"+UserName+"'";
        var _this = this;
        return new Promise(function (fulfill, reject){
            log.trace("[getTrigramFromUserName] Query :",select);
            _this.con.query( select, (err, result)=>{
                if(err) {
                    log.warn("[getTrigramFromUserName] Error while getting trigram from repository");
                    reject(err);
                }
                if(result[0].trigram){
                    log.debug("[getTrigramFromUserName] Return --> ",result[0].trigram);
                    fulfill(result[0].trigram);
                }
                else {
                    log.warn("[getTrigramFromUserName] Error, trigram not found for user "+UserName);
                    reject({result:'ko',error:'no trigram found',code:110});
                }

            })
        })
    }



    setComunicationInProgress(user, state){
        var update = "UPDATE Neo.USERS SET comunicationInProgress = "+state+" WHERE USERID = '"+user+"'";
        var _this = this;
        return new Promise (function (fulfill, reject){
            log.trace("Update :",update);
            _this.con.query( update, (err, result)=>{
                if(err) {
                    log.warn("Error while setting comunication in progress");
                    reject({status:false, err:err});
                }
                fulfill({status:true});
            })
        })
    }

    setUserLastTs(user, ts){
        var update = "UPDATE Neo.USERS SET lastMsgSentTS = '"+ts+"' WHERE USERID = '"+user+"'";
        var _this = this;
        return new Promise (function (fulfill, reject){
            log.trace("Update :",update);
            _this.con.query( update, (err, result)=>{
                if(err) {
                    log.warn("Error while setting Users last timestamp");
                    reject({status:false, err:err});
                }
                fulfill({status:true});
            })
        })
    }


    /************************************************************************************************** */
    getFirstTaskMessage(Survey_ID){
        var sql = "select message from Neo.tasks where Survey_ID="+Survey_ID+" and isFirst=true";
        var _this = this;
        return new Promise (function (fulfill, reject){
            log.trace("sql :",sql);
            _this.con.query( sql, (err, result)=>{
                if(err) {
                    log.warn("Error getting the Task Message for the Survey ID: ",Survey_ID);
                    reject({status:false, err:err});
                }
                if(result[0])
                    fulfill(result[0]);
                else
                    reject({status:"ok",error:"112",message:"Error, Survey not found"})
            })
        })
    }

    getTaskAttechments(Task_ID){
        var sql="select A.fallback, A.color, A.pretext, A.author_name, A.author_link, A.author_icon, A.title, \
                        A.title_link, A.text as AText, A.image_url, A.thumb_url, A.footer, A.footer_icon, A.callback_id,\
                        B.name, B.text as BText, C.type, B.value, B.url, B.style \
                        FROM Neo.attachments A, Neo.actions B, Neo.ActionType C \
                        where B.attachment_ID = A.ID AND B.type = C.ID AND A.Task_ID="+Task_ID;
        var _this = this;
        return new Promise ( (fulfill, reject) => {
            log.trace("sql :",sql);
            _this.con.query( sql, (err, result)=>{
                if(err) {
                    log.warn("Error getting the attachments for Task ID :",Task_ID);
                    reject({status:false, err:err});
                }

                if(result){
                    /** Create the right JSON */
                    var actions=[];
                    var action={};
                    var attachment={};
                    result.forEach( row =>{
                        log.trace("Row : ",row);
                        attachment['title']=row.title;
                        attachment['title_link']=row.title_link;
                        attachment['image_url']=row.image_url;
                        attachment['thumb_url']=row.thumb_url;
                        attachment['footer']=row.footer;
                        attachment['footer_icon']=row.footer_icon;
                        attachment['fallback']=row.fallback;
                        attachment['callback_id']=row.callback_id;
                        attachment['color']=row.color;
                        attachment['attachment_type']=row.attachment_type;
                        attachment['pretext']=row.pretext;
                        attachment['author_name']=row.author_name;
                        attachment['author_link']=row.author_link;
                        attachment['text']=row.AText;

                        action['name']=row.name;
                        action['text']=row.BText;
                        action['type']=row.type;
                        action['value']=row.value;
                        action['url']=row.url;
                        action['style']=row.style;

                        actions.push(action);
                        action={};
                    })
                    attachment['actions']=actions;

                    log.debug("Result JSON : ",attachment);

                    fulfill(attachment);

                    /************************ */
                }
                else{
                    log.warn("No data found! ", result, "Error ",err);
                    fulfill({result:false, message:"No data foud"});
                }
                    
            })
        })
    }
}

module.exports = Repo;