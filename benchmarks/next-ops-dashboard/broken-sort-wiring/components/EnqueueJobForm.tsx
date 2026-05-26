"use client";

import { useState } from "react";
import type { EnqueueBody } from "../lib/types";

export function EnqueueJobForm() {
	const [draft, setDraft] = useState<EnqueueBody>({ name: "" });

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				void fetch("/api/jobs", { method: "POST", body: JSON.stringify(draft) });
			}}
		>
			<label>
				Job name
				<input value={draft.name} onChange={(event) => setDraft({ name: event.target.value })} />
			</label>
			<button type="submit">Enqueue</button>
		</form>
	);
}
