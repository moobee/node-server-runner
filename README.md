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
