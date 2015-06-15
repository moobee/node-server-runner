'use strict';

var config = require('./config.js');

var forever = require('forever-monitor');

var nodemailer = require('nodemailer');
var sendmailTransport = require('nodemailer-sendmail-transport');

var argv = require('minimist')(process.argv.slice(2));

var restartCount = 0;

var transporter = nodemailer.createTransport(sendmailTransport({
    path: 'sendmail',
    args: [ '-t', '-i' ],
}));

/**
 * Envoie un mail à l'admin du serveur
 */
var sendMail = function (subject, text) {

    // envoi du mail a l'admin
    transporter.sendMail({
        from: 'error@node-server-runner.com',
        to: config.admin,
        subject: subject,
        text: text,
    }, function (err) {
        if (err) {
            console.log(err);
        }
    });
};


// si la ligne de commande a été lancée avec le nom du fichier du server avec le nom du fichier de log
if (process.argv[2] && argv.logFile) {
    var child = new (forever.Monitor)(process.argv[2], {
        silent: true,
        args: [],
        errFile: argv.logFile, // logs
        killTree: true,
    });

    console.log('Start server ...');

    // à chaque restart
    child.on('restart', function () {

        restartCount++;

        if (restartCount >= config.maxRestartCount) {
            sendMail('Le serveur a crashé', 'Le serveur crashait en boucle et a été définitivement arrêté après ' + config.maxRestartCount + ' crashs');
            process.exit();
        }

        sendMail('Le serveur a redémarré', 'Une erreur est survenue sur le serveur ' + process.argv[2] + ', consultez les logs dans : ' + argv.logFile);

        console.log('error server ' + process.argv[2] + ' : consultez le fichier log ' + argv.logFile);

    });

    child.start();
}
else {
    console.log('Arguments manquants\nUtilisez : node run-forever.js path/to/mon-fichier.js --logFile  path/to/fichierLog.log');
}
