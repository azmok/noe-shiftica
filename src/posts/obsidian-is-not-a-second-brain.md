---
title: Obsidian Is Not a "Second Brain" — A Database Engineer's Verdict on the Myth
slug: obsidian-is-not-a-second-brain
description: Is Obsidian really a second brain? Analyzed from a data-structure perspective, it is a degraded relational database. Here is what an actual second brain looks like — RDB + Vector + Graph — and how to build it in the AI era.
date: 2026-07-13
author: 奥村 東
---
<link rel="stylesheet" href="../../_css/md/ini.md.css" />
<h1 class="text-gradient">Obsidian Is Not a "Second Brain" — A Database Engineer's Verdict on the Myth</h1>

<body lang="en">
	
## TL;DR

<div class="tldr">
	
- Obsidian's [[links]] are manual data entry into a junction table with fragile
  filename-string keys — structurally, a degraded relational database
- "Manual linking is good for your brain" has zero research behind it; worse,
  you can only link what you already know, so it reinforces your blind spots
- "Plain text lasts forever" is a myth as a differentiator: SQLite is a Library
  of Congress-recommended format with support pledged through 2050
- What Obsidian actually is: an excellent notepad — not a second brain
- A real second brain mirrors the brain's associative network: RDB + Vector
  (semantic search) + Graph (multi-hop relations), with edges computed
  automatically to surface connections you had forgotten
- Existing users: staying is rational. Newcomers: don't invest — building the
  superior version with an AI agent is now faster than mastering the inferior
  one. A starter prompt for the prototype is included in the article

</div>

## Introduction: The Discomfort I Couldn't Ignore

I finally tried Obsidian. The tool that half the internet calls a "second brain."

My honest first impression: *"Wait... why is everyone grateful for this? In the age of AI, this is painfully clunky."*

But a gut feeling is not an argument. So I sat down and dissected the tool from the perspective that matters most for any knowledge system: **data structure**. This article is the result.

The conclusion, stated upfront so you can decide whether to keep reading: **if you are an engineer considering Obsidian today, the benefits are too thin to justify adopting it.** Not because it is a bad app — but because what it actually is, and what it claims to be, are two different things. And in 2026, you can build something categorically better.

One thing before we start: **this article is not an attack on people who already use Obsidian.** If you have mastered it and it works for you, the switching cost is real and your workflow is your own. My argument is aimed at one specific decision: whether someone who has *not yet invested* should start now. Learning a tool from scratch is a cost, and that cost deserves a return.

This article is written for developers who are on the fence about adopting Obsidian. Let's walk through the evidence.

## 1. What Obsidian Actually Is: A Data-Structure Autopsy

Strip away the UI and the community mythology, and look at what Obsidian's core feature — the `[[wiki link]]` — really is.

When you type `[[Some Note]]`, you are manually writing a row into a **junction table** (an intermediate table that records many-to-many relationships, typically shaped like `edges(from_id, to_id)`). That is all a link is. You, the human, are performing manual data entry for a relationship table — the exact kind of work databases were invented to manage.

It gets worse when you look at the keys:

- **Links and tags are the same thing.** A link points from one note to another. A tag points from a note to a category. Structurally, both are just **pointers (references)**. Obsidian presents them as different features, but that distinction is an illusion created by the "file" as a physical unit. Underneath, it is one relation type wearing two costumes.
- **The primary key (the unique identifier for each record) is a filename string.** Rename a file, and every reference to it must be rewritten. Obsidian patches this with auto-rename tooling, but the fragility is architectural: a proper RDB (relational database) uses immutable IDs precisely so that names can change freely without breaking relationships.

So here is the first verdict, and it is not rhetorical exaggeration but a structural description:

**Obsidian is a degraded relational database** — one where the human performs the annotation labor by hand, the keys are brittle strings, and the query engine is your scroll wheel.

## 2. The Deficit Sheet: Obsidian vs. a Real Database Stack

For developers, a side-by-side table says it fastest.

| Aspect | Obsidian | RDB + Vector + Graph |
|---|---|---|
| Link creation | Manual (a "have-to" chore) | Automatic (via embedding similarity) |
| Discoverable relationships | Only what you already know to connect | Latent connections you had forgotten |
| Scale behavior | Graph view degrades into a hairball | Dynamic extraction via queries |
| Data integrity | Filename-dependent, fragile | ID-managed, robust |
| Query capability | Text search + plugins | SQL, recursive queries, semantic search |

Every row of the left column is labor or fragility. Every row of the right column is automation or robustness. This is the gap I felt in my gut before I could articulate it.

## 3. "But Manual Linking Is Good for Your Brain" — Examining the Strongest Counterargument

This is the hill Obsidian advocates defend, so let's take it seriously.

The claim rests on a real phenomenon: the **generation effect** (the finding that information you actively produce yourself is remembered better than information you passively receive). Yes, this effect exists. But notice what it applies to: **learning and memory retention.** If your goal is to memorize material, effortful encoding helps.

Here is the analogy that clarified everything for me. Manual linking is the "handwriting with a pen" of knowledge management. People say: *"Typing is faster and more accurate, but writing by hand sticks in memory best."* And handwriting does have research behind it — studies on note-taking have found retention advantages for handwritten notes. But the costs are enormous: slow input, poor legibility, painful editing and copying. Faced with that trade-off, almost every professional types.

Now here is the part that makes Obsidian's position *weaker* than the pen's: **there is, to my knowledge, no research demonstrating that manually creating wiki links improves memory or insight.** The pen at least has evidence. Manual linking is defended purely by analogy to it. The strongest argument for Obsidian's core ritual is borrowed credibility.

And there is a deeper cognitive problem. Humans can only draw links between things they *already* consider important — connections inside their existing comfort zone. In terms of cognitive science, your **RAS (Reticular Activating System, the brain's attention filter)** only surfaces what your current importance function flags. That means manual linking systematically reinforces your existing biases and past framings. Your **scotoma (psychological blind spot)** doesn't shrink; it hardens.

A "second brain" that can only reflect what your first brain already believes is not a second brain. It is a mirror.

## 4. "But Plain Text Lasts Forever" — Dismantling the Durability Myth

The second pillar of Obsidian advocacy: *"It's just Markdown files. Readable in 50 years. A database is a black box."*

This sounds airtight until you check the facts about SQLite (the most widely deployed database engine in the world, embedded in essentially every phone and browser):

- SQLite's file format is a **recommended long-term storage format of the U.S. Library of Congress** — the institution whose literal job is deciding what will still be readable in a century.
- The SQLite development team has **publicly pledged support through the year 2050**, with a guaranteed backward-compatible file format.
- A SQLite database is a single, self-contained file. Written in C — the language whose compilers will outlive every app on your machine. If the data survives, recovery is trivial.

And here is the architectural point that fully retires the objection: in the system I propose below, the source text of every note lives inside the database. Embeddings (numerical vectors representing the meaning of text) go stale when models change? Regenerate them from source. The GUI's dependencies rot in ten years? Rebuild it — with AI assistance, at a fraction of the original cost. **The fragile layers are disposable by design, because the durable layer holds everything needed to regenerate them.**

Plain text is durable. So is SQLite. Durability is not a differentiator; it is table stakes that both sides meet.

## 5. Fairness Check: What Obsidian Is Genuinely Good At

Criticism without fairness is just noise, so let me state clearly where Obsidian earns its popularity. It is an outstanding **cost-evasion package** for the three most tedious parts of building any note system:

1. **Editor UI/UX** — real-time preview, Markdown rendering, mobile input optimization. The grubbiest, most thankless frontend work, done for you.
2. **Loose coupling with the OS filesystem** — your data is just folders and `.md` files, so native OS features and external tooling work directly on it.
3. **Sync infrastructure** — plain-text diff syncing is mature, battery-friendly technology, and Obsidian's conflict handling is solid.

All true. But look at what that list describes: an excellent **notepad**. A superbly engineered text editor with file-linking sugar on top.

An excellent notepad is a fine thing to be. The problem is the sign on the door. The gap between "second brain" — the claim — and "notepad with manual pointers" — the reality — is the entire subject of this article.

## 6. What an Actual Second Brain Requires

If we are going to use the word "brain," we should take the brain's architecture seriously.

Your brain does not store memories in folders. It does not store them in two-dimensional tables. Memory in the brain is an **associative network (semantic network)** — concepts as nodes, weighted connections as edges, and recall as activation spreading through those connections. When you remember one thing and three related things surface uninvited, that is the network doing automatic edge traversal.

Now map that onto data structures, and the correct architecture writes itself:

- **RDB** for the robust, ID-managed storage layer — the substrate.
- **Vector search** (computing the semantic closeness of texts as numerical distance) — so the system knows that two notes are *about* the same thing even when they share no keywords and you never linked them.
- **Graph structure** (traversing multi-hop relationships with recursive queries) — so the system can walk two, three steps outward from any node, exactly like spreading activation in the brain.

The decisive difference from Obsidian: **the edges are computed, not hand-entered.** The machine finds the connection between a note you wrote in April and one you wrote last week — a connection you never noticed, because it sat outside your importance filter. That is the moment your scotoma gets removed *automatically*. Manual linking can never produce this, by definition: you cannot link what you cannot see.

That experience — the system surfacing a three-steps-away relationship you had forgotten — is what "second brain" should mean. Not a mirror of your first brain. An extension of it.

## 7. The Neo Second Brain: A Blueprint You Can Build Today

Here is the full architecture I am proposing — and, further below, a prompt you can hand to an AI coding agent to start building it.

```
[Data layer]      SQLite (or PostgreSQL + pgvector) — robust ID-managed RDB
      ↓
[Analysis layer]  Vector (semantic similarity, fully automatic)
                  + Graph (multi-hop relations via recursive queries)
      ↓
[Cognition layer] The human just writes notes in flow state
                  (zero manual annotation — "want-to" input only)
      ↓
[Output UI]       Zoomable mind-map + note GUI with dynamic filters
                  (macro gestalt ⇄ micro detail, seamlessly)
```

The three signature behaviors:

**① Zoom UI — macro and micro in one continuous space.** At the macro level, your knowledge floats as a visual network of nodes and edges — connection strength shown by thickness, clusters by spatial grouping, speaking directly to your visual-spatial memory. Tap a node, and it morphs into a full note editor. Overview and detail are one gesture apart, not two different apps.

**② Dynamic RDB filtering — the cure for the hairball.** Every mind-map tool dies the same death: too many nodes, spaghetti everywhere. Here, the map is not a static drawing but a **live query result**. Filter by date, tag, or "relations within 2 hops of this node," and the map rebuilds in real time showing only that subgraph. The visual noise is removed to match the capacity of human attention.

**③ Flow input + automatic annotation.** You write. That is your entire job. On save, the system extracts entities, timestamps, and semantic embeddings, writes the relations into the junction tables, and places the new node into the network — edges included. The "have-to" labor that Obsidian demands is deleted from the workflow entirely.

### Two Hard Problems (Stated Honestly)

If I told you this is trivial to build, I would be doing to you what Obsidian marketing does. Two design challenges decide whether this system feels magical or broken:

1. **Layout continuity.** If every filter operation recomputes node positions from scratch, your spatial memory ("that cluster was in the upper left") resets each time — destroying the very cognitive advantage the map exists to provide. Node positions must persist, with filters animating differences rather than redrawing worlds.
2. **Edge-generation thresholds.** Automatic edges via embedding similarity need tuning. Too loose, and everything connects to everything — a hairball again. Too strict, and you get isolated islands. The robust design is two-stage: similarity for candidate edges, then an LLM pass to label and prune the relationships.

Neither problem is a wall. Both are exactly the kind of iterative design work that AI pair-programming handles well — which brings us to the prompt.

### Starter Prompt for an AI Coding Agent

Paste the following into your agentic coding environment to generate a working prototype:

```
Build a local-first "Neo Second Brain" prototype web app.

## Stack
- Backend: Node.js + SQLite (better-sqlite3) with the sqlite-vec extension
- Frontend: React + React Flow (graph canvas) + a Markdown editor pane
- Embeddings: pluggable provider interface (assume an embed(text) -> float[] function; stub it with a local model or API of my choice)

## Data model
- notes(id INTEGER PRIMARY KEY, title TEXT, body TEXT, created_at, updated_at)
- embeddings(note_id, vector BLOB)  — one per note, regenerable
- edges(from_id, to_id, weight REAL, label TEXT, source TEXT CHECK(source IN ('auto','manual')))
- tags(note_id, tag TEXT)
All relations use integer IDs. Titles are display-only, never keys.

## Core behaviors
1. On note save: re-embed the note, recompute candidate edges to existing
   notes via cosine similarity (threshold as a config constant, default 0.78),
   upsert into edges with source='auto'. Never delete manual edges.
2. Graph API: GET /graph?root={id}&hops={n}&tag={t}&from={date}&to={date}
   returns the filtered subgraph using a recursive CTE over edges.
3. Frontend: force-directed layout ON FIRST RENDER ONLY. Persist node
   positions in a node_positions table. On filter change, animate
   enter/exit of nodes; never recompute positions of surviving nodes.
4. Zoom interaction: clicking a node opens the note editor in a side pane;
   double-click transitions the node into a full-screen editor.
5. Include a "reindex all" command that regenerates every embedding and
   all auto edges from source text (proves the disposable-layer design).

## Constraints
- Single repo, npm scripts for dev/run
- Seed with 30 sample notes across 3 topics so the graph is demoable
- Write a README explaining the threshold tuning knobs

Confirm the schema with me before implementing the frontend.
```

Run it, iterate on the two hard problems above, and you will have — in days, not months — a system that does what Obsidian's marketing promises and its architecture cannot deliver.

### The Adoption Calculus for Newcomers

Pulling this together for the reader actually facing the decision, the case against starting Obsidian today reduces to three plain statements:

1. **There is nothing to learn "from scratch" for.** Obsidian has its own learning curve — vault conventions, linking discipline, plugin ecosystem, community workflows like Zettelkasten. That is real study time invested into a tool whose core mechanism is manual data entry.
2. **Every job it does is already done by tech you likely know.** Notes and sync? Any Markdown editor plus your existing cloud. Relationships and retrieval? A database. Semantic recall? Vector search. You are not choosing between Obsidian and nothing; you are choosing between Obsidian and technologies with broader applicability that were already on your learning path as a developer.
3. **If what attracts you is the Obsidian-like experience itself — the linked, visual, explorable knowledge graph — building the superior version with AI is now *faster* than mastering the inferior one.** The prompt above is not a toy; it scaffolds in an afternoon what would take weeks of vault gardening to approximate, and the skills you exercise (schema design, embeddings, graph queries) compound into everything else you build.

For an existing user, sunk mastery changes the math, and staying can be rational. For a newcomer, the math only points one way.

## 8. Conclusion: Stop Worshipping the Notepad

Let me compress the whole argument:

- Structurally, Obsidian is a **degraded RDB**: manual junction-table entry with fragile string keys.
- Its core ritual, manual linking, has **less scientific backing than handwriting with a pen** — and cognitively, it reinforces your blind spots rather than removing them.
- Its durability advantage is **a myth**; SQLite is a Library of Congress-recommended format with support pledged through 2050.
- What it genuinely offers is a polished notepad — valuable, but not what it says on the label.
- A real second brain mirrors the brain's actual architecture: **an associative network with automatic edge formation.** That is RDB + Vector + Graph, wrapped in a zoomable, dynamically filtered mind-map GUI.

Five years ago, building that system meant months of engineering, so settling for Obsidian was rational. Today, an AI agent scaffolds the prototype from a single prompt. The rational calculus has flipped 💡

To be clear one final time: existing Obsidian users have a working system and no obligation to abandon it. But if you are standing at the entrance today, deciding where to invest your learning hours — don't spend them mastering manual annotation. The same hours, pointed at RDB + Vector + Graph with an AI agent at your side, buy you a system that actually deserves the name.

The tools we call "second brains" should be judged by one standard: do they show you what you could not see yourself? By that standard, the choice is no longer close.

## Related Articles

<!-- TODO: noe-shiftica.com/blog の関連記事リンクをここに追記 -->
</body>