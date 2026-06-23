using System.Globalization;
using System.Text;
using CsvHelper;
using CsvHelper.Configuration;
using OnboardingDiary.Api.DTOs.Reports;

namespace OnboardingDiary.Api.Services;

public class CsvReportFormatter : IReportFormatter
{
    public string ContentType => "text/csv";
    public string FileExtension => ".csv";

    public byte[] Generate(ReportData data)
    {
        using var memoryStream = new MemoryStream();
        using var writer = new StreamWriter(memoryStream, Encoding.UTF8);
        using var csv = new CsvWriter(writer, new CsvConfiguration(CultureInfo.InvariantCulture));

        if (data.Tasks.Count > 0 || data.Type is "tasks" or "combined")
        {
            csv.WriteField("--- Tasks ---");
            csv.NextRecord();
            csv.WriteField("Date"); csv.WriteField("Title"); csv.WriteField("Category");
            csv.WriteField("Status"); csv.WriteField("Priority"); csv.WriteField("Description");
            csv.NextRecord();
            foreach (var t in data.Tasks)
            {
                csv.WriteField(t.Date); csv.WriteField(t.Title); csv.WriteField(t.Category);
                csv.WriteField(t.Status); csv.WriteField(t.Priority); csv.WriteField(t.Description);
                csv.NextRecord();
            }
        }

        if (data.Issues.Count > 0 || data.Type is "issues" or "combined")
        {
            csv.WriteField("--- Issues ---");
            csv.NextRecord();
            csv.WriteField("Date"); csv.WriteField("Title"); csv.WriteField("Severity");
            csv.WriteField("Status"); csv.WriteField("Description"); csv.WriteField("Resolution");
            csv.NextRecord();
            foreach (var i in data.Issues)
            {
                csv.WriteField(i.Date); csv.WriteField(i.Title); csv.WriteField(i.Severity);
                csv.WriteField(i.Status); csv.WriteField(i.Description); csv.WriteField(i.ResolutionNotes);
                csv.NextRecord();
            }
        }

        if (data.Feedback.Count > 0 || data.Type is "feedback" or "combined")
        {
            csv.WriteField("--- Feedback ---");
            csv.NextRecord();
            csv.WriteField("Date"); csv.WriteField("Subject"); csv.WriteField("Type"); csv.WriteField("Details");
            csv.NextRecord();
            foreach (var f in data.Feedback)
            {
                csv.WriteField(f.Date); csv.WriteField(f.Subject); csv.WriteField(f.Type); csv.WriteField(f.Details);
                csv.NextRecord();
            }
        }

        writer.Flush();
        return memoryStream.ToArray();
    }
}
