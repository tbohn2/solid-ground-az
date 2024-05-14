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
        public static async Task WriteResponseAsync(HttpContext context, int statusCode, string contentType, object data)
        {
            context.Response.StatusCode = statusCode;
            context.Response.ContentType = contentType;
            await context.Response.WriteAsync(JsonConvert.SerializeObject(data));
            return;
        }
        private static async Task GetAppts(HttpContext context)
        {
            try
            {
                if (context.Request.RouteValues["month"] == null || context.Request.RouteValues["year"] == null)
                {
                    await WriteResponseAsync(context, 400, "application/json", "Invalid month or year");
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
                        await WriteResponseAsync(context, 404, "application/json", "No appointments found");
                        return;
                    }
                    else
                    {
                        await WriteResponseAsync(context, 200, "application/json", appts);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred: {ex.Message}");
                await WriteResponseAsync(context, 500, "application/json", "An error occurred while getting data");
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
                    await WriteResponseAsync(context, 400, "application/json", "Invalid data, please provide required appointment and client data");
                    return;
                }

                using (var scope = context.RequestServices.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<StretchSchedulerContext>();
                    var requestedAppt = await dbContext.Appointments.FindAsync(appt.Id);
                    if (requestedAppt == null)
                    {
                        await WriteResponseAsync(context, 404, "application/json", "Appointment not found");
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
                await WriteResponseAsync(context, 200, "application/json", "Appointment requested successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred: {ex.Message}");
                await WriteResponseAsync(context, 500, "application/json", "An error occurred while requesting the appointment");
            }
        }
    }
}