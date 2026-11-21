import { createRequire } from "node:module";
import { isSearchReady, shouldOpenSuggestions, searchFilter, MIN_QUERY } from "../lib/search-query.ts";

const people = [
  { value: "list:joel-lewenstein", label: "Joel Lewenstein", keywords: ["Design", "OpenAI"] },
  { value: "list:jake-moxey", label: "Jake Moxey", keywords: ["Product"] },
];

let failed = 0;
function assert(name, cond) {
  if (!cond) {
    failed++;
    console.error("FAIL", name);
  } else {
    console.log("ok  ", name);
  }
}

assert("MIN_QUERY is 3", MIN_QUERY === 3);
assert("empty is not ready", !isSearchReady(""));
assert("2 chars not ready", !isSearchReady("jo"));
assert("3 chars ready", isSearchReady("joe"));
assert("padded 3 chars ready", isSearchReady("  joe  "));
assert("padded 2 chars not ready", !isSearchReady("  jo  "));
assert("closed when collapsed even at 3", !shouldOpenSuggestions(false, "joe"));
assert("closed when expanded at 2", !shouldOpenSuggestions(true, "jo"));
assert("open when expanded at 3", shouldOpenSuggestions(true, "joe"));
assert("open uses the incoming value, not the previous one", shouldOpenSuggestions(true, "joe") && !shouldOpenSuggestions(true, "jo"));

// Simulate typing j, jo, joe, joel — open should flip on the 3rd character
const typed = ["", "j", "jo", "joe", "joel"];
const opens = typed.map((value) => shouldOpenSuggestions(true, value));
assert("typing sequence opens on 3rd char", JSON.stringify(opens) === JSON.stringify([false, false, false, true, true]));

// Simulate deleting back below 3
const deleted = ["joel", "joe", "jo", "j", ""];
const closes = deleted.map((value) => shouldOpenSuggestions(true, value));
assert("deleting closes below 3", JSON.stringify(closes) === JSON.stringify([true, true, false, false, false]));

assert("filter hides all below 3", people.every((p) => !searchFilter(p, "jo")));
assert("filter matches joel at 3", searchFilter(people[0], "joe"));
assert("filter can miss at 3", !searchFilter(people[1], "joe"));
assert("filter matches keywords", searchFilter(people[0], "ope"));

// Contrast with the stale-ready bug: onOpenChange used the previous ready flag
function buggyOpen(prevValue, nextValue) {
  const staleReady = isSearchReady(prevValue);
  // SDK asks to open on the same tick as the value change
  const suggestOpen = true && staleReady && true;
  const readyAfterRender = isSearchReady(nextValue);
  return suggestOpen && readyAfterRender;
}
assert("stale ready would wait until 4th char", buggyOpen("jo", "joe") === false && buggyOpen("joe", "joel") === true);
assert("correct logic opens on the 3rd char", shouldOpenSuggestions(true, "joe") === true);

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log("\nall passed");
