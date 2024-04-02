using System;
using System.IO;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using StretchScheduler.Models;

namespace StretchScheduler
{
    public static class Endpoints
    {
        public static void MapEndpoints(IApplicationBuilder app)
        {
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapPost("/api/months", async context =>
                {
                    // Read the request body to get the month data: MonthNumber, Name, YearNumber
                    var requestBody = await new StreamReader(context.Request.Body).ReadToEndAsync();

                    try
                    {
                        // Deserialize the JSON request body and create an instance of a Month
                        var newMonth = JsonConvert.DeserializeObject<Month>(requestBody);

                        if (newMonth == null)
                        {
                            context.Response.StatusCode = 400; // Bad Request
                            await context.Response.WriteAsync("Invalid month data");
                            return;
                        }

                        using (var scope = app.ApplicationServices.CreateScope())
                        {
                            var dbContext = scope.ServiceProvider.GetRequiredService<StretchSchedulerContext>();

                            // Find the corresponding year in the database based on the provided YearNumber
                            var year = await dbContext.Years.FirstOrDefaultAsync(y => y.YearNumber == newMonth.YearNumber);

                            if (year == null)
                            {
                                Console.WriteLine("Year not found, adding the year first");
                                Year newYear = new(newMonth.YearNumber) { YearNumber = newMonth.YearNumber }; // Create a new Year instance
                                await dbContext.Years.AddAsync(newYear);
                                await dbContext.SaveChangesAsync();
                                year = newYear;
                            }

                            newMonth.Year = year;
                            newMonth.YearNumber = year.YearNumber;

                            // Add the new month to the Months DbSet
                            await dbContext.Months.AddAsync(newMonth);
                            await dbContext.SaveChangesAsync();
                        }

                        context.Response.StatusCode = 201; // Created
                        context.Response.ContentType = "application/json";
                        await context.Response.WriteAsync(JsonConvert.SerializeObject(newMonth));
                    }
                    catch (DbUpdateException ex)
                    {
                        // Log the exception details
                        Console.WriteLine($"An error occurred while saving changes to the database: {ex.InnerException?.Message}");
                        context.Response.StatusCode = 500; // Internal Server Error
                        await context.Response.WriteAsync("An error occurred while saving changes to the database.");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"An error occurred: {ex.Message}");
                        context.Response.StatusCode = 500; // Internal Server Error
                        await context.Response.WriteAsync("An error occurred while creating the month.");
                    }
                });
            });
        }
    }
}
