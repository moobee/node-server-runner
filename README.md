# node-server-runner

node-server-runner permet de lancer un process node en tâche de fond (avec forever)
afin qu'il envoie un mail à un administrateur en cas de crash.

### Installation


Depuis la racine du projet :

- Copier le fichier de config :

   ```
   cp config.js.default config.js && nano config.js
   ```

- Installer les dépendances :

   ```
   npm install
   ```
- Installer le package

	```
	sudo npm install -g node-server-runner
	```

### Utilisation

- Syntaxe

	```
	node-server-runner /path/to/my/server/server.js --logFile /path/to/log/file/serverLogs.log --adminMail example@admin.com
	```

### Configuration

- Dans le module node-server-runner

	Le serveur peut s'arrêter définitivement au bout de n restart (5 par defaut : maxRestartCount) mais aussi si il y a t d'intervale entre deux erreurs (avec t à 6000 ms par défaut : minTimeBetweenCrashes)

	Pour overider ses paramètres, il faut les préciser dans le constructeur du serverRunner de cette manière :

	```
	var serverRunner = new NodeServerRunner(serverFile, argv.logFile, argv.adminMail, maxRestartCount, minTimeBetweenCrashes);
	```




