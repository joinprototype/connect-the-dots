# ADR-0028: One box

- Status: accepted
- Date: 2026-11-02

## Context

The founder, 2026-11-02: "the explore and stories and map and connect - too much and complicated." The nav had four doors to one room. A reader had to learn what each was before asking anything, and the thing the site does, showing how two things connect, was one click behind a choice. Three designers each took one idea to its end. One Box won: its first screen explains the product with no help text, and it builds on what exists. Its prototype is in `.cache/design/box`.

## Decision

1. **The product is one box.** Type a name, two names, a year or a question, and you get the answer with its proof. The header on every page holds the mark and the box. The nav goes.
2. **The first screen is a name and the stories it runs through.** "Standard Oil runs through three stories", each story a dot on one line, as real links. "Another name" shows the next. The picks are editorial, in `threads` of `content/featured.yaml`, and a person reviews each. The first plan, a question with its route, read as trivia ("Gutenberg Bible, edition of the Bible"), and the good material is the written stories (founder, 2026-11-02).
3. **Nothing is taken away.** `/c/`, `/w/`, `/x/` and `/r/` keep working and keep their addresses. They stop being doors in a nav and become what an answer leads to ("See it on the Map"), and the footer lists them for anyone who wants to wander.
4. **Two names are one answer.** `/r/` answers any pair. A direct tie comes first, in its own relation with its caveat, even one no route may use (ADR-0027). Then the way between them. A pair with neither says so plainly.
5. **Empty box, the stories.** The Stories page draws each story as an island of its own dots. It is the answer for someone with nothing to type. A plain list stays beside it, for phones and screen readers.
6. **Any name in a story is a door.** The first mention of an entry in a scene links to its page.
7. **The box repeats nothing it did not find.** It knows names, pairs, years and the four questions. No page ever prints free text from a URL or the field as a heading or an answer, so no address can be made into a false claim with our name on it. A hostile question finds no entry and gets the same plain reply as any other. Question pages exist only where `not_asked` and `needs` allow, as today.

## Rejected

- **One Place** (one surface, every story an island, nothing else): the most striking first screen, but it costs the real Earth and 434 scenes' maps, needs new engineering everywhere, and hangs a story's name over everyone merely mentioned in it. Its island picture is kept for the Stories page.
- **One Thread** (open on a story, follow names): the best reading, but following dot to dot is how a conspiracy board works, and on a site read as proof that cannot be the whole shape of it. Its doors are kept inside stories.
- **Grey open data everywhere** (the prototype's "colour means someone read it"): right on a route, where a stop from open data is drawn grey and dashed. On the Map, colour means kind (ADR-0024), and that stays for now.

## Consequences

- A reader learns one thing. A person with nothing to type gets a name and its stories.
- Wandering is one step further away, and the shelf leaves the first screen, though stories now fill it. Watch whether people still find the rest.
- The box promises more than it knows. It must say plainly what it can do when it cannot help.
- Typing on a phone is work, so "Another name" and the suggestions do a lot of it.
