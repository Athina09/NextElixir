from __future__ import annotations

from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from forecastiq.reports.content import ReportContent, TableSection, TextSection


def render_pdf(content: ReportContent) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, title=content.title)
    styles = getSampleStyleSheet()

    story = [
        Paragraph(content.title, styles["Title"]),
        Paragraph(f"Generated at {content.generated_at}", styles["Normal"]),
        Spacer(1, 12),
    ]

    for section in content.sections:
        story.append(Paragraph(section.title, styles["Heading2"]))
        if isinstance(section, TextSection):
            for line in section.body.split("\n") or [""]:
                story.append(Paragraph(line or "&nbsp;", styles["Normal"]))
        elif isinstance(section, TableSection):
            data = [section.columns] + [[_fmt(v) for v in row] for row in section.rows]
            table = Table(data, repeatRows=1)
            table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                        ("FONTSIZE", (0, 0), (-1, -1), 8),
                    ]
                )
            )
            story.append(table)
        story.append(Spacer(1, 12))

    doc.build(story)
    return buffer.getvalue()


def _fmt(value: object) -> str:
    if isinstance(value, float):
        return f"{value:,.2f}"
    return str(value)
