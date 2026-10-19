# Format des profils d'instruments (`notenn-instrument`, version 1)

Un profil décrit le clavier d'un instrument : ce que joue chaque bouton, poussé et tiré, et les basses. Le moteur s'en sert pour choisir les doigtés ; le Système Argoat pour écrire la tablature. Un fichier JSON par modèle, modifiable à la main.

Exemple de référence : `packages/engine/src/profiles/hohner-2915-gc.json`.

## Champs

| Champ | Obligatoire | Rôle |
|---|---|---|
| `format` | oui | Toujours `"notenn-instrument"`. |
| `version` | oui | `1`. |
| `id` | oui | Identifiant stable, en minuscules avec tirets (`hohner-2915-gc`). |
| `name` | oui | Nom affiché (`Hohner 2915 Sol/Do`). |
| `family` | oui | `"diatonic-accordion"` (seule famille prise en charge pour l'instant). |
| `source` | non | D'où viennent les notes (plan de clavier, mesure faite par…). |
| `rows` | oui | Les rangs de la main droite, du plus intérieur au plus extérieur. |
| `bass` | non | Les groupes de basses de la main gauche. |

### Rangs (`rows`)

| Champ | Défaut | Rôle |
|---|---|---|
| `id` | — | Identifiant unique dans le profil (`do`, `sol`). |
| `name` | — | Nom affiché. |
| `suffix` | `""` | Signe ajouté au numéro dans la tablature : `"'"` pour le rang intérieur en Système Argoat. |
| `offset` | `0` | Décalage vertical du rang, en boutons, par rapport aux autres (sert à mesurer les déplacements de la main). |
| `cost` | `0` | Pénalité par note pour un rang moins pratique : plus elle est haute, moins le moteur l'utilise. |
| `buttons` | — | Liste de paires `[poussé, tiré]`, bouton 1 côté menton. |

Les notes s'écrivent en notation anglaise avec l'octave : `C4` est le Do central (MIDI 60), `F#5`, `Bb3`. Les octaves peuvent être relatives : seul l'écart entre les notes compte pour le moteur.

### Basses (`bass`)

Chaque groupe porte le numéro affiché dans la tablature (`id`, entier à partir de 1) et, pour `push` et `pull` :

- `bass` : la note de basse, sans octave (`"C"`, `"F#"`) ;
- `chord` : l'accord, par son nom (`"C"`, `"Am"`, `"D7"`, `"Em7"`) ou par ses notes (`["E", "G#", "B"]`).

## Erreurs

`parseProfile` refuse un profil incomplet et dit où est le problème, par exemple :
`rows[1].buttons[3] (bouton 4) : note tirée illisible : "Do5" (exemple valide : "C4", "F#5")`.

## Évolutions prévues

Nouvelles familles (chromatique, concertina, piano, cordes…) et accords main droite : ils viendront avec une version 2 du format, la version 1 restant lisible.
