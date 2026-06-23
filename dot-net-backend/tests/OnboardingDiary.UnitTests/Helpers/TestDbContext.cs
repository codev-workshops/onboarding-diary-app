using Microsoft.EntityFrameworkCore;
using OnboardingDiary.Api.Data;

namespace OnboardingDiary.UnitTests.Helpers;

public static class TestDbContext
{
    public static AppDbContext Create()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_" + Guid.NewGuid())
            .Options;

        return new AppDbContext(options);
    }
}
