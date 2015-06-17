'use strict';

var forever = require('forever');
var monitor = require('forever-monitor');

var nodemailer = require('nodemailer');
var sendmailTransport = require('nodemailer-sendmail-transport');

var transporter = nodemailer.createTransport(sendmailTransport({
    path: 'sendmail',
    args: [ '-t', '-i' ],
}));

/**
 * Envoie un mail à l'admin du serveur
 */
var sendMail = function (subject, text, recipient, sender, done) {

    done = done || function () {};

    var mailOptions = {
        to: recipient,
        subject: subject,
        text: text,
    };

    if (sender) {
        mailOptions.from = sender;
    }

    // envoi du mail a l'admin
    transporter.sendMail(mailOptions, function (err) {
        if (err) { console.log(err); }
        done();
    });
};

var NodeServerRunner = function (serverFile, logFile, adminMail, senderMail, uid, maxRestartCount, minTimeBetweenCrashes) {
    this.serverFile = serverFile;
    this.logFile = logFile;
    this.adminMail = adminMail;
    this.senderMail = senderMail;
    this.uid = uid;
    this.maxRestartCount = maxRestartCount || 5;
    this.minTimeBetweenCrashes = minTimeBetweenCrashes || 6000;
};

NodeServerRunner.prototype = {

    constructor: NodeServerRunner,

    serverFile: null,
    logFile: null,
    adminMail: null,
    maxRestartCount: null,
    minTimeBetweenCrashes: null,
    loopRestartCount: 0,
    lastCrashTime: null,

    _sendInfo: function (subject, text, done) {
        // Tag en début de mail
        var tag = this.uid ? '[' + this.uid + '] ' : '';
        // Infos du serveur
        var serverInfos = '\n\n- uid : ' + this.uid + '\n- fichier : ' + this.serverFile + '\n- logs : ' + this.logFile;

        sendMail(tag + subject, text + serverInfos, this.adminMail, this.senderMail, done);
    },

    start: function () {

        console.log('Lancement du serveur ' + this.serverFile + '. Les logs seront enregistrés dans ' + this.logFile);
        console.log('Le serveur se relancera s\'il crash ' + this.maxRestartCount + ' fois (avec moins de ' + this.minTimeBetweenCrashes + 'ms d\'intervale)');
        console.log('Les mails d\'erreur seront envoyés à ' + this.adminMail + '.');

        var child = new (monitor.Monitor)(this.serverFile, {
            silent: true,
            uid: this.uid,
            args: [],
            errFile: this.logFile, // logs
            killTree: true,
        });



        forever.startServer(child);

        child.start();

        // à chaque restart
        child.on('restart', function () {

            var currentTime = new Date().getTime();

            var timeFromLastCrash = this.lastCrashTime ? currentTime - this.lastCrashTime : 0;

            console.log('Précédent crash il y a : ' + timeFromLastCrash + 'ms');

            if (!this.lastCrashTime || timeFromLastCrash <= this.minTimeBetweenCrashes) {
                this.loopRestartCount++;
            }
            else {
                this.loopRestartCount = 1;
            }
            console.log('Le serveur a crashé ' + this.loopRestartCount + ' fois de suite.');

            if (this.loopRestartCount >= this.maxRestartCount) {
                this._sendInfo('Le serveur a crashé', 'Le serveur crashait en boucle et a été définitivement arrêté après ' + this.maxRestartCount + ' crashs.', function () {
                    process.exit();
                });
            }

            this.lastCrashTime = currentTime;

            this._sendInfo('Le serveur a redémarré', 'Le serveur a redémarré, peut-être à cause d\'une erreur.\nVous pouvez voir l\'erreur en question dans le fichier de logs.');

            return console.log('Erreur du serveur ' + this.serverFile + ' : consultez le fichier log ' + this.logFile);

        }.bind(this));

        console.log('Start server ...');

    },
};

module.exports = NodeServerRunner;
