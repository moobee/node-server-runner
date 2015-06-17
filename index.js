'use strict';

var forever = require('forever');
var monitor = require('forever-monitor');
var moment = require('moment');
moment.locale('fr');

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
    lastError: null,

    _sendInfo: function (subject, text, done) {

        done = done || function () {};

        // Tag en début de mail
        var tag = this.uid ? '[' + this.uid + '] ' : '';
        // Infos du serveur
        var serverInfos = '\n\n- uid : ' + this.uid + '\n- fichier : ' + this.serverFile + '\n- logs : ' + this.logFile;

        sendMail(tag + subject, text + serverInfos, this.adminMail, this.senderMail, done);
    },

    start: function () {

        console.log('Lancement du serveur ' + this.serverFile + '. Les logs seront enregistrés dans ' + this.logFile);
        console.log('Le serveur s\'arrêtera définitivement s\'il crashe ' + this.maxRestartCount + ' fois (avec moins de ' + this.minTimeBetweenCrashes + 'ms d\'intervale)');
        console.log('Les mails d\'erreur seront envoyés à ' + this.adminMail + '.');

        var child = new (monitor.Monitor)(this.serverFile, {
            append: true,
            silent: true,
            uid: this.uid,
            args: [],
            errFile: this.logFile, // logs
            killTree: true,
        });

        forever.startServer(child);

        child.start();

        // On stocke la dernière erreur pour pouvoir l'envoyer par mail
        child.on('stderr', function (data) {
            var StringDecoder = require('string_decoder').StringDecoder;
            var decoder = new StringDecoder('utf8');
            this.lastError = {
                output: decoder.write(data),
                date: moment(),
            };
        }.bind(this));

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
                this._sendInfo('Le serveur a crashé', 'Le serveur a été arrêté après ' +
                    this.maxRestartCount + ' crashs consécutifs.',
                    function () {
                        process.exit();
                    }
                );
            }

            this.lastCrashTime = currentTime;

            var errorText = '';
            if (this.lastError) {
                errorText = '\nLa dernière erreur à s\'être produite est la suivante (' + this.lastError.date.fromNow() + ') :\n\n' +
                    this.lastError.output + '\n\n';
            }

            this._sendInfo('Le serveur a redémarré', 'Le serveur a redémarré, peut-être ' +
                'à cause d\'une erreur.\n' + errorText + 'Vous pouvez voir toutes les erreurs ' +
                'dans le fichier de logs.'
            );

            return console.log('Erreur du serveur ' + this.serverFile + ' : consultez le fichier log ' + this.logFile);

        }.bind(this));

        console.log('Start server ...');
    },
};

module.exports = NodeServerRunner;
