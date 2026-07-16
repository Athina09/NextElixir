import openpyxl
from io import BytesIO

from forecastiq.reports.content import ReportContent, TableSection, TextSection
from forecastiq.reports.csv import render_csv
from forecastiq.reports.excel import render_excel
from forecastiq.reports.pdf import render_pdf


def _sample_content() -> ReportContent:
    return ReportContent(
        title="Executive Report",
        generated_at="2026-07-15T00:00:00",
        sections=[
            TextSection("Executive summary", "Line one\nLine two"),
            TableSection("Forecast", ["Metric", "P10", "P50", "P90"], [["Revenue", 1.0, 2.0, 3.0]]),
        ],
    )


def test_render_pdf_produces_a_valid_pdf():
    result = render_pdf(_sample_content())
    assert result.startswith(b"%PDF")
    assert len(result) > 500


def test_render_excel_produces_a_readable_workbook():
    result = render_excel(_sample_content())
    workbook = openpyxl.load_workbook(BytesIO(result))
    sheet = workbook.active
    values = [cell.value for row in sheet.iter_rows() for cell in row if cell.value is not None]
    assert "Executive Report" in values
    assert "Line one" in values
    assert "Revenue" in values


def test_render_csv_includes_every_section():
    result = render_csv(_sample_content()).decode("utf-8")
    assert "Executive Report" in result
    assert "# Executive summary" in result
    assert "Line one" in result
    assert "# Forecast" in result
    assert "Revenue,1.0,2.0,3.0" in result
