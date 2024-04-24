using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using StretchScheduler.Models;

namespace StretchScheduler
{
    public static class UserRoutes
    {
        public static void MapEndpoints(IEndpointRouteBuilder endpoints)
        {
            endpoints.MapGet("/api/apptsInMonth/{month}/{year}", GetAppts);
            endpoints.MapPut("/api/requestAppt", RequestAppt);
        }
        private static async Task GetAppts(HttpContext context)
        {
            try
            {
                if (context.Request.RouteValues["month"] == null || context.Request.RouteValues["year"] == null)
                {
                    context.Response.StatusCode = 400; // Bad Request
                    await context.Response.WriteAsync("Invalid month or year");
                    return;
                }

                var month = Convert.ToInt32(context.Request.RouteValues["month"]);
                var year = Convert.ToInt32(context.Request.RouteValues["year"]);


                using (var scope = context.RequestServices.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<StretchSchedulerContext>();
                    var appts = await dbContext.Appointments.Where(a => a.DateTime.Month == month && a.DateTime.Year == year).Include(a => a.Client).ToListAsync();
                    if (appts == null)
                    {
                        context.Response.StatusCode = 404; // Not Found
                        await context.Response.WriteAsync("No appointments found");
                        return;
                    }
                    else
                    {
                        context.Response.StatusCode = 200; // OK
                        context.Response.ContentType = "application/json";
                        await context.Response.WriteAsync(JsonConvert.SerializeObject(appts));
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred: {ex.Message}");
                context.Response.StatusCode = 500; // Internal Server Error
                await context.Response.WriteAsync("An error occurred while getting data");
            }
        }
        private static async Task RequestAppt(HttpContext context)
        {
            var requestBody = await new StreamReader(context.Request.Body).ReadToEndAsync();
            try
            {
                var appt = JsonConvert.DeserializeObject<Appointment>(requestBody);
                var client = JsonConvert.DeserializeObject<Client>(requestBody);

                if (appt == null || client == null)
                {
                    context.Response.StatusCode = 400; // Bad Request
                    await context.Response.WriteAsync("Invalid data, please provide required appointment and client data");
                    return;
                }

                using (var scope = context.RequestServices.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<StretchSchedulerContext>();
                    var requestedAppt = await dbContext.Appointments.FindAsync(appt.Id);
                    if (requestedAppt == null)
                    {
                        context.Response.StatusCode = 404; // Not Found
                        await context.Response.WriteAsync("Appointment not found");
                        return;
                    }
                    var existingClient = await dbContext.Clients.FirstOrDefaultAsync(c => c.Email == client.Email);
                    if (existingClient == null)
                    {
                        Client newClient = new Client
                        {
                            Name = client.Name,
                            Email = client.Email,
                            Phone = client.Phone
                        };
                        await dbContext.Clients.AddAsync(newClient);
                        existingClient = newClient;
                    }
                    requestedAppt.Type = appt.Type;
                    requestedAppt.Price = appt.Price;
                    requestedAppt.Duration = appt.Duration;
                    requestedAppt.ClientId = existingClient.Id;
                    requestedAppt.Client = existingClient;
                    requestedAppt.Status = Appointment.StatusOptions.Requested;
                    await dbContext.SaveChangesAsync();
                }

                context.Response.StatusCode = 200; // OK
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync("Appointment requested successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred: {ex.Message}");
                context.Response.StatusCode = 500; // Internal Server Error
                await context.Response.WriteAsync("An error occurred while updating the appointment");
            }
        }

    }
}