from __future__ import annotations

from io import BytesIO

from openpyxl import Workbook

from forecastiq.reports.content import ReportContent, TableSection, TextSection


def render_excel(content: ReportContent) -> bytes:
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = content.title[:31]  # Excel sheet name limit

    sheet.append([content.title])
    sheet.append([f"Generated at {content.generated_at}"])
    sheet.append([])

    for section in content.sections:
        sheet.append([section.title])
        if isinstance(section, TextSection):
            for line in section.body.split("\n"):
                sheet.append([line])
        elif isinstance(section, TableSection):
            sheet.append(section.columns)
            for row in section.rows:
                sheet.append(row)
        sheet.append([])

    buffer = BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()
