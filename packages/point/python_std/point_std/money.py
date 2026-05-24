from __future__ import annotations


def formatCentsUsd(cents: int) -> str:
	sign = "-" if cents < 0 else ""
	abs_cents = abs(int(cents))
	dollars, remainder = divmod(abs_cents, 100)
	return f"{sign}${dollars}.{remainder:02d}"
