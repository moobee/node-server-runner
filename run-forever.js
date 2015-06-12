'use strict';

var config = require('./config.js');

var forever = require('forever-monitor');

var nodemailer = require('nodemailer');
var sendmailTransport = require('nodemailer-sendmail-transport');

var argv = require('minimist')(process.argv.slice(2));


// si la ligne de commande a été lancée avec le nom du fichier du server avec le nom du fichier de log
if (process.argv[2] && argv.logFile) {
	var child = new (forever.Monitor)(process.argv[2], {
		silent: true,
		args: [],
		errFile: argv.logFile, // logs
	});

	console.log('Start server ...');

	// à chaque restart
	child.on('restart', function (err) {
		console.log('error server ' + process.argv[2] + ' : consultez le fichier log ' + argv.logFile);

		var transporter = nodemailer.createTransport(sendmailTransport({
		    path: 'sendmail',
		    args: [ '-t', '-i' ],
		}));

		// envoi du mail a l'admin
		transporter.sendMail({
		    from: config.sender,
		    to: config.admin,
		    subject: 'Error node server',
		    text: 'Une erreur est survenue sur le serveur ' + process.argv[2] + ', consultez les logs dans : ' + argv.logFile,
		    replyTo: config.noreplyAddress,
		}, function (err) {
			if (err) {
				console.log(err);
			}
		});
	});


	child.start();
}
else {
	console.log('Arguments manquants\nUtilisez : node run-forever.js path/to/mon-fichier.js --logFile  path/to/fichierLog.log');
}


