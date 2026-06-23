using OnboardingDiary.Api.DTOs.Reports;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace OnboardingDiary.Api.Services;

public class PdfReportFormatter : IReportFormatter
{
    public string ContentType => "application/pdf";
    public string FileExtension => ".pdf";

    public byte[] Generate(ReportData data)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);

                page.Header().Text($"Onboarding Diary Report — {data.UserName}")
                    .FontSize(16).Bold();

                page.Content().PaddingVertical(10).Column(col =>
                {
                    col.Item().Text($"Period: {data.DateFrom} to {data.DateTo}").FontSize(10);
                    col.Item().PaddingVertical(5);

                    if (data.Tasks.Count > 0)
                    {
                        col.Item().Text("Tasks").FontSize(14).Bold();
                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(c =>
                            {
                                c.RelativeColumn(1); c.RelativeColumn(2);
                                c.RelativeColumn(1); c.RelativeColumn(1);
                            });
                            table.Header(h =>
                            {
                                h.Cell().Text("Date").Bold();
                                h.Cell().Text("Title").Bold();
                                h.Cell().Text("Status").Bold();
                                h.Cell().Text("Priority").Bold();
                            });
                            foreach (var t in data.Tasks)
                            {
                                table.Cell().Text(t.Date.ToString());
                                table.Cell().Text(t.Title);
                                table.Cell().Text(t.Status.ToString());
                                table.Cell().Text(t.Priority.ToString());
                            }
                        });
                        col.Item().PaddingVertical(5);
                    }

                    if (data.Issues.Count > 0)
                    {
                        col.Item().Text("Issues").FontSize(14).Bold();
                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(c =>
                            {
                                c.RelativeColumn(1); c.RelativeColumn(2);
                                c.RelativeColumn(1); c.RelativeColumn(1);
                            });
                            table.Header(h =>
                            {
                                h.Cell().Text("Date").Bold();
                                h.Cell().Text("Title").Bold();
                                h.Cell().Text("Severity").Bold();
                                h.Cell().Text("Status").Bold();
                            });
                            foreach (var i in data.Issues)
                            {
                                table.Cell().Text(i.Date.ToString());
                                table.Cell().Text(i.Title);
                                table.Cell().Text(i.Severity.ToString());
                                table.Cell().Text(i.Status.ToString());
                            }
                        });
                        col.Item().PaddingVertical(5);
                    }

                    if (data.Feedback.Count > 0)
                    {
                        col.Item().Text("Feedback").FontSize(14).Bold();
                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(c =>
                            {
                                c.RelativeColumn(1); c.RelativeColumn(2);
                                c.RelativeColumn(1); c.RelativeColumn(2);
                            });
                            table.Header(h =>
                            {
                                h.Cell().Text("Date").Bold();
                                h.Cell().Text("Subject").Bold();
                                h.Cell().Text("Type").Bold();
                                h.Cell().Text("Details").Bold();
                            });
                            foreach (var f in data.Feedback)
                            {
                                table.Cell().Text(f.Date.ToString());
                                table.Cell().Text(f.Subject);
                                table.Cell().Text(f.Type.ToString());
                                table.Cell().Text(f.Details);
                            }
                        });
                    }
                });

                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("Page ");
                    x.CurrentPageNumber();
                    x.Span(" of ");
                    x.TotalPages();
                });
            });
        });

        return document.GeneratePdf();
    }
}
