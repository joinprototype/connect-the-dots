# ADR-0028: One box

- Status: accepted
- Date: 2026-11-02

## Context

The founder, 2026-11-02: "the explore and stories and map and connect - too much and complicated." The nav had four doors to one room. A reader had to learn what each was before asking anything, and the thing the site does, showing how two things connect, was one click behind a choice. Three designers each took one idea to its end. One Box won: its first screen explains the product with no help text, and it builds on what exists. Its prototype is in `.cache/design/box`.

## Decision

1. **The product is one box.** Type a name, two names, a year or a question, and you get the answer with its proof. The header on every page holds the mark and the box. The nav goes.
2. **The first screen follows a name.** Home opens on one name and the written stories it runs through: "Standard Oil runs through three stories". "Another name" moves to the next. 367 names run through two or more stories, and each of those ties was read and sourced by someone. The picks are editorial, in `content/featured.yaml`, never computed, and no pick or story there touches a sealed entry.
3. **Nothing is taken away.** `/c/`, `/w/`, `/x/` and `/r/` keep working and keep their addresses, and answers lead to them ("See it on the Map"). Amended in 0.4.8: with the nav gone, the founder could not find the Map ("like where is the map and stuff?"). So the header keeps three plain links beside the box, Stories, Map and Explore, on their own row on a phone. Home shows the Map's picture beside the thread, and a short list of ways in under the stories.
4. **Two names are one answer.** `/r/` answers any pair. A direct tie comes first, in its own relation with its caveat, even one no route may use (ADR-0027). Then the way between them. A pair with neither says so plainly.
5. **Empty box, the stories.** The Stories page draws each story as an island of its own dots. It is the answer for someone with nothing to type. A plain list stays beside it, for phones and screen readers.
6. **Any name in a story is a door.** The first mention of an entry in a scene links to its page.
7. **The box repeats nothing it did not find.** It knows names, pairs, years and the four questions. No page ever prints free text from a URL or the field as a heading or an answer, so no address can be made into a false claim with our name on it. A hostile question finds no entry and gets the same plain reply as any other. Question pages exist only where `not_asked` and `needs` allow, as today.

## Rejected

The founder later asked for One Place and One Thread whole, as ways in rather than the whole site: see [ADR-0030](0030-three-pages-whole.md).

- **A question and its route on the first screen** (the One Box prototype): true but thin. "Gutenberg Bible, edition of the Bible, scripture of Christianity" proves a route exists and tells you nothing, and the founder found it short. A route still answers two names, but it does not open the site.
- **One Place** (one surface, every story an island, nothing else): the most striking first screen, but it costs the real Earth and 434 scenes' maps, needs new engineering everywhere, and hangs a story's name over everyone merely mentioned in it. Its island picture is kept for the Stories page.
- **One Thread** (open on a story, follow names): the best reading, but following dot to dot is how a conspiracy board works, and on a site read as proof that cannot be the whole shape of it. Its doors are kept inside stories.
- **Grey open data everywhere** (the prototype's "colour means someone read it"): right on a route, where a stop from open data is drawn grey and dashed. On the Map, colour means kind (ADR-0024), and that stays for now.

## Consequences

- A reader learns one thing. A person with nothing to type gets a name to follow, and ends up reading.
- Wandering is one step further away, and the shelf leaves the first screen. Watch whether people still find the stories.
- The box promises more than it knows. It must say plainly what it can do when it cannot help.
- Typing on a phone is work, so "Another name" and the suggestions do a lot of it.
- A name running through several stories can read as more than it is, so the first screen carries "A connection is not evidence of wrongdoing."
