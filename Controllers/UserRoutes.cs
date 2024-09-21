using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using StretchScheduler.Models;
using static StretchScheduler.Models.Appointment;
using System.Net;
using System.Net.Mail;

namespace StretchScheduler
{
    public static class UserRoutes
    {
        public static void MapEndpoints(IEndpointRouteBuilder endpoints)
        {
            endpoints.MapGet("/api/apptsInMonth/{month}/{year}", GetAppts);
            endpoints.MapGet("/api/services", GetServices);
            endpoints.MapPost("/api/sendEmail", SendEmail);
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
                    var idString = Environment.GetEnvironmentVariable("ID");
                    if (Guid.TryParse(idString, out Guid adminId))
                    {
                        var dbContext = scope.ServiceProvider.GetRequiredService<StretchSchedulerContext>();
                        var appts = await dbContext.Appointments.Where(a => a.DateTime >= DateTime.Now && a.DateTime.Month == month && a.DateTime.Year == year && a.Status == StatusOptions.Available && a.AdminId == adminId
                        || a.DateTime.Month == month && a.DateTime.Year == year && a.Status == StatusOptions.Firm).OrderBy(a => a.DateTime).Include(a => a.ApptType).ToListAsync();
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
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred: {ex.Message}");
                await WriteResponseAsync(context, 500, "application/json", "An error occurred while getting data");
            }
        }
        private static async Task GetServices(HttpContext context)
        {
            try
            {
                using (var scope = context.RequestServices.CreateScope())
                {
                    var idString = Environment.GetEnvironmentVariable("ID");
                    if (Guid.TryParse(idString, out Guid adminId))
                    {
                        var dbContext = scope.ServiceProvider.GetRequiredService<StretchSchedulerContext>();
                        var services = await dbContext.ApptTypes.Where(a => a.AdminId == adminId && a.Private == true).ToListAsync();
                        if (services == null)
                        {
                            await WriteResponseAsync(context, 404, "application/json", "No services found");
                            return;
                        }
                        else
                        {
                            await WriteResponseAsync(context, 200, "application/json", services);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred: {ex.Message}");
                await WriteResponseAsync(context, 500, "application/json", "An error occurred while getting data");
            }
        }
        private static async Task SendEmail(HttpContext context)
        {
            var requestBody = await new StreamReader(context.Request.Body).ReadToEndAsync();
            try
            {
                var userEmail = JsonConvert.DeserializeObject<Email>(requestBody);
                if (userEmail == null)
                {
                    await WriteResponseAsync(context, 400, "application/json", "Invalid data, please provide required email data");
                    return;
                }
                var email = Environment.GetEnvironmentVariable("EMAIL");
                var password = Environment.GetEnvironmentVariable("GPW");
                if (email == null || email == "" || password == null || password == "")
                {
                    await WriteResponseAsync(context, 500, "application/json", "Server error; Email credentials not found");
                    return;
                }

                SmtpClient smtpClient = new SmtpClient("smtp.gmail.com");
                smtpClient.Port = 587;
                smtpClient.Credentials = new NetworkCredential(email, password);
                smtpClient.EnableSsl = true;

                MailMessage mailMessage = new MailMessage();
                mailMessage.From = new MailAddress(userEmail.EmailAddress);
                mailMessage.To.Add(email);
                mailMessage.Subject = "New Message from " + userEmail.FirstName + " " + userEmail.LastName;
                mailMessage.Body = userEmail.FirstName + " " + userEmail.LastName + " (" + userEmail.EmailAddress + ")" + " sent the following message: " + userEmail.Message;

                try
                {
                    smtpClient.Send(mailMessage);
                    Console.WriteLine("Email sent successfully.");
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Failed to send email: " + ex.Message);
                    await context.Response.WriteAsync(ex.Message);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred: {ex.Message}");
                await WriteResponseAsync(context, 500, "application/json", "An error occurred while sending the email");
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
                    var requestedApptType = await dbContext.ApptTypes.FindAsync(appt.ApptTypeId);
                    if (requestedApptType == null)
                    {
                        await WriteResponseAsync(context, 404, "application/json", "Appointment type not found");
                        return;
                    }
                    var existingClient = await dbContext.Clients.FirstOrDefaultAsync(c => c.Email == client.Email);
                    if (existingClient == null)
                    {
                        var idString = Environment.GetEnvironmentVariable("ID");
                        Guid.TryParse(idString, out Guid adminId);

                        Client newClient = new Client
                        {
                            Name = client.Name,
                            Email = client.Email,
                            Phone = client.Phone,
                            AdminId = adminId
                        };
                        await dbContext.Clients.AddAsync(newClient);
                        existingClient = newClient;
                    }
                    requestedAppt.ApptTypeId = appt.ApptTypeId;
                    requestedAppt.ApptType = requestedApptType;
                    requestedAppt.ClientId = existingClient.Id;
                    requestedAppt.Client = existingClient;
                    requestedAppt.Status = StatusOptions.Requested;
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