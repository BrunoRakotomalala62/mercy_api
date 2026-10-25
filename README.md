# Mercy API

API REST déployable sur Vercel pour interroger au choix :

- `mercury-2`
- `mercury-2.5`
- `mercury-3` (modèle par défaut)

Elle conserve la conversation grâce au paramètre `uid`, accepte jusqu'à quatre images par URL HTTPS ou data URL en POST et ne révèle jamais la clé Inception au client.

## Route demandée

### Conversation texte

```text
GET /api?mercy=bonjour&uid=123&model=mercury-3
```

Exemple sûr avec encodage URL :

```bash
curl -G "https://YOUR_PROJECT.vercel.app/api" \
  -H "Authorization: Bearer $MERCY_API_TOKEN" \
  --data-urlencode "mercy=Bonjour, qui es-tu ?" \
  --data-urlencode "uid=123" \
  --data-urlencode "model=mercury-3"
```

Réutilisez le même `uid` pour poursuivre la conversation :

```bash
curl -G "https://YOUR_PROJECT.vercel.app/api" \
  -H "Authorization: Bearer $MERCY_API_TOKEN" \
  --data-urlencode "mercy=Peux-tu préciser ta réponse précédente ?" \
  --data-urlencode "uid=123" \
  --data-urlencode "model=mercury-3"
```

### Reconnaissance d'image

```text
GET /api?mercy=décrivez bien cette photo&image=URL_IMAGE_ICI&uid=123&model=mercury-3
```

Exemple :

```bash
curl -G "https://YOUR_PROJECT.vercel.app/api" \
  -H "Authorization: Bearer $MERCY_API_TOKEN" \
  --data-urlencode "mercy=Décrivez bien cette photo" \
  --data-urlencode "image=https://example.com/photo.jpg" \
  --data-urlencode "uid=123" \
  --data-urlencode "model=mercury-3"
```

> **Limite importante :** les trois modèles de chat Mercury sont textuels. Pour une image, l'API télécharge le fichier de façon contrôlée, l'envoie à `mercury-decide` pour produire des observations visuelles structurées, puis demande au modèle de chat choisi de rédiger la réponse. Cette solution permet classification et description générale, mais elle n'est pas équivalente à un modèle vision génératif capable de produire une légende libre très détaillée.

Mercury Decide exige des images PNG, JPEG, WebP ou GIF en base64. L'API effectue automatiquement la conversion depuis les URL HTTPS publiques. En POST, elle accepte aussi directement des data URLs et jusqu'à quatre images dans le tableau `images`. Les URL locales/privées sont bloquées pour éviter les attaques SSRF.

## Choix du modèle

Utilisez le paramètre `model` :

```text
model=mercury-2
model=mercury-2.5
model=mercury-3
```

Les alias `2`, `2.5` et `3` sont également acceptés. La disponibilité effective de Mercury 2 et 2.5 dépend des droits du compte Inception ; Mercury 3 est recommandé.

Le paramètre facultatif `effort` accepte : `instant`, `low`, `medium` ou `high`.

## Méthode POST recommandée

GET est fourni comme demandé, mais son URL peut être conservée dans les historiques, journaux et outils d'analyse. Utilisez POST pour les messages sensibles :

```bash
curl -X POST "https://YOUR_PROJECT.vercel.app/api" \
  -H "Authorization: Bearer $MERCY_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Bonjour",
    "uid": "123",
    "model": "mercury-3"
  }'
```

Avec une image :

```json
{
  "message": "Décrivez bien cette photo",
  "image": "https://example.com/photo.jpg",
  "uid": "123",
  "model": "mercury-3"
}
```

Avec plusieurs images ou des fichiers convertis en data URLs par un site web :

```json
{
  "message": "Compare ces deux images",
  "images": [
    "data:image/jpeg;base64,...",
    "https://example.com/photo-2.png"
  ],
  "uid": "123",
  "model": "mercury-3",
  "reset": true
}
```

## Réponse JSON

```json
{
  "ok": true,
  "request_id": "26f3c32e-947d-4b2e-a03e-98435703d15d",
  "uid": "123",
  "model": "mercury-3",
  "reasoning_effort": "low",
  "answer": "Bonjour ! Comment puis-je vous aider ?",
  "usage": {
    "prompt_tokens": 12,
    "completion_tokens": 10,
    "total_tokens": 22
  },
  "tokens": {
    "chat": {
      "input": 12,
      "cached_input": 0,
      "output": 10,
      "reasoning": 0,
      "total": 22
    },
    "vision": null,
    "request": {
      "input": 12,
      "output": 10,
      "total": 22
    },
    "free_tier_projection": {
      "reference_tokens": 100000000,
      "similar_requests": 4545454,
      "basis": "Projection théorique à consommation identique; ce n'est pas le solde réel du compte."
    }
  },
  "image": null,
  "conversation": {
    "message_count": 2,
    "persistent": true,
    "backend": "upstash",
    "ttl_seconds": 604800,
    "warning": null
  }
}
```

Pour une image, le champ `image` contient également les observations et l'utilisation de `mercury-decide`. Le champ normalisé `tokens` additionne automatiquement le chat et la vision :

- `tokens.chat` : entrée, sortie, raisonnement et total du modèle de chat ;
- `tokens.vision` : entrée, sortie et total de `mercury-decide`, ou `null` sans image ;
- `tokens.request` : consommation complète de la requête ;
- `tokens.free_tier_projection.similar_requests` : nombre théorique de requêtes identiques pour 100 millions de tokens. Cette projection n'est pas le solde réel du compte.

Les tokens de raisonnement font déjà partie des tokens de sortie et ne sont donc pas comptés deux fois.

## Effacer une conversation

```bash
curl -G "https://YOUR_PROJECT.vercel.app/api" \
  -H "Authorization: Bearer $MERCY_API_TOKEN" \
  --data-urlencode "uid=123" \
  --data-urlencode "reset=1"
```

## Installation locale

Prérequis : Node.js 20 ou supérieur.

```bash
git clone https://github.com/BrunoRakotomalala62/mercy_api.git
cd mercy_api
npm install
cp .env.example .env
```

Renseignez une **nouvelle** clé dans `.env` :

```dotenv
INCEPTION_API_KEY=votre_nouvelle_cle
MERCY_API_TOKEN=un_secret_long_et_aleatoire
```

Démarrez :

```bash
npm run dev
```

Puis ouvrez :

```text
http://localhost:3000/api
```

## Déploiement Vercel

Le fichier `vercel.json` est déjà inclus.

1. Importez ce dépôt dans Vercel.
2. Dans **Project Settings → Environment Variables**, ajoutez :
   - `INCEPTION_API_KEY`
   - `MERCY_API_TOKEN`
3. Pour un historique fiable entre les fonctions serverless, créez une base Upstash Redis et ajoutez :
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. Redéployez le projet.

Sans Redis, l'API fonctionne, mais l'historique reste en mémoire et peut disparaître lors d'un redémarrage ou changement d'instance Vercel. La réponse indique alors `"persistent": false`.

## Variables d'environnement

| Variable | Obligatoire | Valeur par défaut | Description |
|---|---:|---:|---|
| `INCEPTION_API_KEY` | Oui | — | Clé Inception utilisée côté serveur |
| `MERCY_API_TOKEN` | Recommandé | vide | Protège votre API publique et votre quota |
| `DEFAULT_MODEL` | Non | `mercury-3` | Modèle utilisé si `model` est absent |
| `DEFAULT_REASONING_EFFORT` | Non | `low` | Effort de raisonnement par défaut |
| `MAX_COMPLETION_TOKENS` | Non | `1200` | Limite de sortie par réponse |
| `FREE_TOKEN_REFERENCE` | Non | `100000000` | Référence utilisée pour projeter le nombre de requêtes similaires |
| `UPSTASH_REDIS_REST_URL` | Recommandé | vide | URL REST Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | Recommandé | vide | Jeton REST Upstash |
| `CONVERSATION_TTL_SECONDS` | Non | `604800` | Durée de vie de l'historique (7 jours) |
| `MAX_HISTORY_MESSAGES` | Non | `24` | Nombre maximal de messages conservés |
| `MAX_IMAGE_BYTES` | Non | `7340032` | Taille maximale téléchargée, en octets |
| `IMAGE_HOST_ALLOWLIST` | Non | vide | Hôtes d'images autorisés, séparés par des virgules |
| `ALLOWED_ORIGINS` | Non | `*` | Origines CORS autorisées |

Consultez `.env.example` pour la liste complète.

## Sécurité

- Ne placez jamais `INCEPTION_API_KEY` dans le code, une URL ou Git.
- La clé précédemment publiée dans une conversation doit être révoquée et remplacée avant le déploiement.
- Configurez `MERCY_API_TOKEN` pour empêcher un tiers de consommer votre quota. Envoyez ce secret dans l'en-tête `Authorization`, jamais dans l'URL.
- Un `uid` n'est pas un mot de passe. Utilisez des identifiants longs et aléatoires si plusieurs utilisateurs accèdent à l'API.
- Les images sont limitées en taille, format, protocole et destination réseau.

## Tests

```bash
npm run check
npm test
```


## Documentation OpenAPI

Le contrat de l'API est disponible dans [`openapi.yaml`](./openapi.yaml).

## Licence

MIT
