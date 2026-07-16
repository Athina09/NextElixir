from __future__ import annotations

import csv
from io import StringIO

from forecastiq.reports.content import ReportContent, TableSection, TextSection


def render_csv(content: ReportContent) -> bytes:
    buffer = StringIO()
    writer = csv.writer(buffer)

    writer.writerow([content.title])
    writer.writerow([f"Generated at {content.generated_at}"])
    writer.writerow([])

    for section in content.sections:
        writer.writerow([f"# {section.title}"])
        if isinstance(section, TextSection):
            for line in section.body.split("\n"):
                writer.writerow([line])
        elif isinstance(section, TableSection):
            writer.writerow(section.columns)
            writer.writerows(section.rows)
        writer.writerow([])

    return buffer.getvalue().encode("utf-8")
