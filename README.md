# node-server-runner

node-server-runner permet de lancer un process node en tâche de fond (avec forever)
afin qu'il envoie un mail à un administrateur en cas de crash.

### Installation

```
sudo npm install -g node-server-runner
```

### Utilisation


```
node-server-runner /path/to/my/server/server.js --logFile /path/to/log/file/serverLogs.log --adminMail example@admin.com
```

Il est possible de passer des paramètres optionnels au runner :

```bash
# uid utilisé pour identifier le serveur dans forever
--uid <mon-uid>

# Nombre maximum de reboot consécutif du serveur autorisés
--maxCrash <number>

# Temps minimum en millisecondes entre deux crash pour que ceux-ci soient considérés comme "consécutifs"
--minCrashDelay <timems>
```

__Détacher le processus du terminal__

Pour détacher le processus du shell (et éviter qu'il ne soit tué quand le terminal est fermé ou la
session SSH quittée), il est possible d'utiliser nohup :

```bash
nohup <ma-commande> > /dev/null 2>&1 &
```
