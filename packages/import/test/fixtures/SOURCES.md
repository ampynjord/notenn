# Banc de tests — provenance des fichiers

Uniquement des œuvres du domaine public. Les encodages viennent du corpus distribué avec music21 10.5.0 (logiciel sous licence BSD), sauf mention contraire. Ces fichiers servent aux tests automatiques et ne font pas partie de la bibliothèque publique de Notenn : avant d'y verser une œuvre, revérifier la licence de l'encodage.

| Fichier | Œuvre | Source de l'encodage | Ce qu'il éprouve |
|---|---|---|---|
| `aird-ranting-highlandman.abc` | The Ranting Highlandman, Aird, *Selection of Scotch… Airs*, vol. 1 (1778) | Jack Campin, 2009 (corpus music21 `airdsAirs`) | C barré, reprises, levée |
| `aird-soldiers-joy.abc` | Soldier's Joy, Aird vol. 1 (1778) | idem | reel, tonalité de Ré |
| `aird-ross-castle.abc` | Ross Castle, Aird vol. 2 | idem | 3/4 |
| `aird-fy-let-us-a-to-the-bridal.abc` | Fy let us a' to the Bridal, Aird vol. 1 | idem | 9/8 (mesure composée) |
| `aird-german-waltz.abc` | German Waltz, Aird vol. 4 | idem | 3/8, tempo `Q:3/8=50`, signes `` ` `` |
| `aird-moon-and-seven-stars.abc` / `.mid` | The Moon and Seven Stars, Aird vol. 1 | idem ; MIDI généré avec music21 | 6/8, même air en ABC et en MIDI |
| `oneill-enchanted-valley.abc` | The Enchanted Valley, O'Neill, *Music of Ireland* (1850 tunes, 1903) | Norbert Paap (corpus `oneills1850`) | air lent en Sol mineur, notes d'agrément, liaisons |
| `oneill-dan-rogers-jig.abc` | Dan Rogers' Jig, O'Neill | idem | 12/8 |
| `oneill-i-leave-you-to-guess.abc` | I Leave You To Guess, O'Neill n° 264 | John Chambers, 1997 | 5/4 puis 6/8 (changement de mesure), mesure fausse dans la source |
| `ryan-acrobats-hornpipe.abc` | Acrobat's Hornpipe, *Ryan's Mammoth Collection* (1883) | John Chambers, 2001 (corpus `ryansMammoth`) | Si bémol, triolets, altérations |
| `nottingham-cuckoos-nest.abc` | Cuckoo's Nest (trad. écossais) | Nottingham Music Database (corpus `nottingham-dataset`) | accords chiffrés `"D"`, parties A/B |
| `auld-lang-syne.abc` | Auld Lang Syne (trad. écossais) | écrit pour Notenn (exemple de l'atelier) | air validé à l'accordéon par l'auteur |
| `bach-bwv66-6.mxl` / `.mid` | Choral BWV 66.6, J. S. Bach | corpus `bach` ; MIDI généré avec music21 | 4 voix, MusicXML compressé, choix du soprano |
| `bach-bwv269.musicxml` | Choral BWV 269, J. S. Bach | idem, décompressé | 3/4, MusicXML non compressé, choix du soprano |
| `handel-lascia-chio-pianga.xml` | Lascia ch'io pianga, Haendel, *Rinaldo* (1711) | corpus `handel` | chant + piano, partie sans nom, 4/4 puis 3/4 |
| `foster-jeanie-light-brown-hair.mxl` | Jeanie with the Light Brown Hair, S. Foster (1854) | corpus `leadSheet` (marqué Public Domain) | grille d'accords, partie sans nom |
| `joplin-maple-leaf-rag.mxl` / `.mid` | Maple Leaf Rag, S. Joplin (1899) | corpus `joplin` ; MIDI généré avec music21 | piano à deux mains, morceau long, notes hors clavier |
| `arrangement-acrobats-hornpipe.mid` | Acrobat's Hornpipe (voir plus haut) | arrangement fabriqué pour Notenn avec music21 | 5 pistes : mélodie, doublure à l'octave, nappe d'accords, basse, batterie (canal 10) ; décalages et durées « humains » |

## Limites connues mises en évidence

- Les changements de mesure en cours de morceau ne sont pas encore pris en compte : la première mesure s'applique partout (`oneill-i-leave-you-to-guess.abc`, `handel-lascia-chio-pianga.xml`).
- Un MIDI ne dit pas s'il y a une levée : l'anacrouse vaut 0 (`bach-bwv66-6.mid` contre 1 temps en MusicXML).
