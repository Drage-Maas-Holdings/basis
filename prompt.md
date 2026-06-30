You are running a short follow-up verification on the already-implemented
Tasks API (Spec 6). Do not change any code unless a genuine bug is found.
This is verification only.

GAPS TO CLOSE:

1. A task linking to BOTH contact_id and deal_id at once was never tested,
   only each in isolation. Spec 6 explicitly allows a task to link to a
   contact, a deal, both, or neither.
   - Create a task with both a valid contact_id and a valid deal_id in the
     same POST request
   - Confirm the response shows both fields set correctly
   - Update an existing task to set both fields via PUT in the same request
   - Confirm both persist correctly together (not just sequentially in
     separate requests)

2. due_at validation was only tested with a string ("not-a-number"). Test
   these additional cases and report the actual behavior for each:
   - A negative integer (e.g. -100)
   - Zero (0)
   - A non-integer number (e.g. 1700000000000.5)
   - State plainly whether each is accepted or rejected, and whether that
     matches the spec's requirement ("must be a valid integer timestamp")

Show raw curl commands and raw responses for every case above, the same
standard as the existing REPORT.md. Append these results to REPORT.md under
a new "Follow-up Verification" section rather than replacing anything.

If any of these reveal a genuine bug (e.g. a non-integer due_at being
silently accepted), report it clearly and ask before fixing — do not
silently patch validation logic without flagging it first.

Do not begin until you have confirmed your understanding of this task.