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
                endpoints.MapPost("/api/newAppt", async context =>
                  {
                      // Read the request body to get the data: MonthNumber, Name, YearNumber
                      var requestBody = await new StreamReader(context.Request.Body).ReadToEndAsync();

                      try
                      {
                          // Deserialize the JSON request body and create an instance of a Month
                          var newAppt = JsonConvert.DeserializeObject<Appointment>(requestBody);
                          var dateData = JsonConvert.DeserializeObject<Date>(requestBody);
                          var monthData = JsonConvert.DeserializeObject<Month>(requestBody);

                          if (newAppt == null || dateData == null || monthData == null)
                          {
                              context.Response.StatusCode = 400; // Bad Request
                              await context.Response.WriteAsync("Invalid appointment data");
                              return;
                          }

                          using (var scope = app.ApplicationServices.CreateScope())
                          {
                              var dbContext = scope.ServiceProvider.GetRequiredService<StretchSchedulerContext>();

                              var year = await dbContext.Years.FirstOrDefaultAsync(y => y.YearNumber == monthData.YearNumber);

                              if (year == null)
                              {
                                  Year newYear = new(monthData.YearNumber) { YearNumber = monthData.YearNumber }; // Create a new Year instance
                                  year = newYear;
                                  await dbContext.Years.AddAsync(year);
                                  await dbContext.SaveChangesAsync();
                              }

                              var month = await dbContext.Months.FirstOrDefaultAsync(m => m.MonthNumber == monthData.MonthNumber && m.YearNumber == year.YearNumber);

                              if (month == null)
                              {
                                  monthData.Year = year;
                                  month = monthData;
                                  await dbContext.Months.AddAsync(month);
                                  await dbContext.SaveChangesAsync();
                              }

                              var date = await dbContext.Dates.FirstOrDefaultAsync(d => d.Id == newAppt.DateId);

                              if (date == null)
                              {
                                  Console.WriteLine("Date is null");
                                  Date newDate = new() { DateNumber = dateData.DateNumber, MonthId = month.Id }; // Create a new Date instance
                                  date = newDate;
                                  await dbContext.Dates.AddAsync(date);
                                  await dbContext.SaveChangesAsync();
                              }

                              newAppt.Date = date;
                              newAppt.DateId = date.Id;
                              await dbContext.Appointments.AddAsync(newAppt);
                              await dbContext.SaveChangesAsync();
                          }

                          context.Response.StatusCode = 201; // Created
                          context.Response.ContentType = "application/json";
                          await context.Response.WriteAsync(JsonConvert.SerializeObject(newAppt));
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
