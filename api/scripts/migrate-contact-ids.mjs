import Database from "better-sqlite3";
import { createId } from "@paralleldrive/cuid2";

const db = new Database("/data/basis.db");

const contacts = db.prepare("SELECT * FROM contacts").all();
const idMap = {};

for (const contact of contacts) {
  const newId = createId();
  idMap[contact.id] = newId;
}

const updateStmt = db.prepare(
  "UPDATE contacts SET id = ? WHERE id = ?",
);

const tx = db.transaction(() => {
  for (const contact of contacts) {
    const newId = idMap[contact.id];
    updateStmt.run(newId, contact.id);
    console.log(`  ${contact.id}  →  ${newId}  (${contact.name})`);
  }
});

console.log(`Migrating ${contacts.length} contact(s) from UUID to cuid2...`);
tx();
console.log("Done.");
