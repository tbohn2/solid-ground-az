using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using StretchScheduler.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System;
using System.Net;
using System.Net.Mail;


namespace StretchScheduler
{
    public static class AdminRoutes
    {
        public static void MapEndpoints(IEndpointRouteBuilder endpoints)
        {
            endpoints.MapGet("/api/clients", GetClients);
            endpoints.MapPost("/api/login", Login);
            endpoints.MapPost("/api/newAdmin", CreateAdmin);
            endpoints.MapPost("/api/newAppts", CreateNewAppts);
            endpoints.MapPut("/api/approveAppt", ApproveAppt);
            endpoints.MapPut("/api/denyAppt", DenyAppt);
            endpoints.MapPut("/api/completeAppt", CompleteAppt);
            endpoints.MapPut("/api/adjustBalance", AdjustBalance);
            endpoints.MapDelete("/api/deleteAppt", DeleteAppt);
            endpoints.MapDelete("/api/deleteClient", DeleteClient);
        }

        private static async Task<bool> Authenticate(HttpContext context)
        {
            var authenticated = await context.AuthenticateAsync(JwtBearerDefaults.AuthenticationScheme);

            if (!authenticated.Succeeded)
            {
                context.Response.StatusCode = 401; // Unauthorized
                await context.Response.WriteAsync("Unauthorized");
                return false;
            }
            else
            {
                return true;
            }

        }
        private static async Task GetClients(HttpContext context)
        {
            var authenticated = await Authenticate(context);
            if (!authenticated) { return; }

            using (var scope = context.RequestServices.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<StretchSchedulerContext>();
                var clients = await dbContext.Clients.ToListAsync();
                var appts = await dbContext.Appointments.Where(a => a.Status != Appointment.StatusOptions.Available).ToListAsync();
                var clientData = clients.Select(client => new
                {
                    Client = client,
                    Appointments = appts.Where(a => a.ClientId == client.Id).ToList()
                }).ToList();
                context.Response.StatusCode = 200; // OK
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(JsonConvert.SerializeObject(clientData));
            }
        }

        private static async Task Login(HttpContext context)
        {
            var requestBody = await new StreamReader(context.Request.Body).ReadToEndAsync();
            try
            {
                var adminLoggingIn = JsonConvert.DeserializeObject<Admin>(requestBody);

                if (adminLoggingIn == null)
                {
                    context.Response.StatusCode = 400; // Bad Request
                    await context.Response.WriteAsync("Invalid username or password");
                    return;
                }

                using (var scope = context.RequestServices.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<StretchSchedulerContext>();
                    var admin = await dbContext.Admins.FirstOrDefaultAsync(a => a.Username == adminLoggingIn.Username);

                    if (admin == null || !admin.VerifyPassword(adminLoggingIn.Password))
                    {
                        context.Response.StatusCode = 401; // Unauthorized
                        await context.Response.WriteAsync("Invalid username or password");
                        return;
                    }

                    var jwtToken = admin.GenerateJwtToken("ouP12@fsNv#27G48E1l1e53T59l8V0Af", "http://localhost:5062", "http://localhost:5173", 60);

                    context.Response.StatusCode = 200; // OK
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsync(JsonConvert.SerializeObject(new { token = jwtToken }));
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred: {ex.Message}");
                context.Response.StatusCode = 500; // Internal Server Error
                await context.Response.WriteAsync("An error occurred while processing the request");
            }
        }
        private static async Task CreateAdmin(HttpContext context)
        {
            var authenticated = await Authenticate(context);
            if (!authenticated) { return; }
            var requestBody = await new StreamReader(context.Request.Body).ReadToEndAsync();
            try
            {
                var adminData = JsonConvert.DeserializeObject<Admin>(requestBody);

                if (adminData == null)
                {
                    context.Response.StatusCode = 400; // Bad Request
                    await context.Response.WriteAsync("Invalid admin data");
                    return;
                }

                using (var scope = context.RequestServices.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<StretchSchedulerContext>();


                    var existingAdmin = await dbContext.Admins.FirstOrDefaultAsync(a => a.Username == adminData.Username);
                    if (existingAdmin != null)
                    {
                        context.Response.StatusCode = 400; // Bad Request
                        await context.Response.WriteAsync("Username already exists");
                        return;
                    }

                    adminData.SetPassword(adminData.Password);

                    await dbContext.Admins.AddAsync(adminData);
                    await dbContext.SaveChangesAsync();

                    context.Response.StatusCode = 201; // Created
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsync(JsonConvert.SerializeObject(adminData));
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred: {ex.Message}");
                context.Response.StatusCode = 500; // Internal Server Error
                await context.Response.WriteAsync("An error occurred while creating the admin.");
            }
        }
        private static async Task CreateNewAppts(HttpContext context)
        {
            var authenticated = await Authenticate(context);
            if (!authenticated) { return; }
            // Data is array of appointments
            var requestBody = await new StreamReader(context.Request.Body).ReadToEndAsync();
            try
            {
                // Deserializes the JSON request body and create an array of appointments
                var newAppts = JsonConvert.DeserializeObject<List<Appointment>>(requestBody);

                if (newAppts == null || !newAppts.Any())
                {
                    context.Response.StatusCode = 400; // Bad Request
                    await context.Response.WriteAsync("Invalid appointment data");
                    return;
                }

                using (var scope = context.RequestServices.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<StretchSchedulerContext>();

                    foreach (var newAppt in newAppts)
                    {
                        newAppt.Status = Appointment.StatusOptions.Available;
                        await dbContext.Appointments.AddAsync(newAppt);
                    }

                    await dbContext.SaveChangesAsync();
                }

                context.Response.StatusCode = 201; // Created
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(JsonConvert.SerializeObject(newAppts));
            }
            catch (DbUpdateException ex)
            {
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
        }
        private static async Task ApproveAppt(HttpContext context)
        {
            var authenticated = await Authenticate(context);
            if (!authenticated) { return; }
            var requestBody = await new StreamReader(context.Request.Body).ReadToEndAsync();
            try
            {
                var appt = JsonConvert.DeserializeObject<Appointment>(requestBody);

                if (appt == null)
                {
                    context.Response.StatusCode = 400; // Bad Request
                    await context.Response.WriteAsync("Invalid appointment data");
                    return;
                }

                using (var scope = context.RequestServices.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<StretchSchedulerContext>();
                    var requestedAppt = await dbContext.Appointments.Include(a => a.Client).FirstOrDefaultAsync(a => a.Id == appt.Id);
                    if (requestedAppt == null || requestedAppt.Client == null)
                    {
                        context.Response.StatusCode = 404; // Not Found
                        await context.Response.WriteAsync("Appointment or Client not found");
                        return;
                    }
                    requestedAppt.Status = Appointment.StatusOptions.Booked;
                    await dbContext.SaveChangesAsync();

                    var email = Environment.GetEnvironmentVariable("EMAIL");
                    var password = Environment.GetEnvironmentVariable("GPW");
                    if (email == null || password == null)
                    {
                        context.Response.StatusCode = 500; // Internal Server Error
                        await context.Response.WriteAsync("Email credentials not found");
                        return;
                    }

                    SmtpClient smtpClient = new SmtpClient("smtp.gmail.com");
                    smtpClient.Port = 587;
                    smtpClient.Credentials = new NetworkCredential(email, password);
                    smtpClient.EnableSsl = true;

                    MailMessage mailMessage = new MailMessage();
                    mailMessage.From = new MailAddress(email);
                    mailMessage.To.Add(requestedAppt.Client.Email);
                    mailMessage.Subject = "Appointment Confirmation";
                    mailMessage.Body = "Your appointment has been confirmed for " + requestedAppt.DateTime.ToLocalTime().ToString("MMMM dd, yyyy 'at' h:mm tt")
                     + " for the following session: " + requestedAppt.Type + ". See you soon!";

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
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred: {ex.Message}");
                context.Response.StatusCode = 500; // Internal Server Error
                await context.Response.WriteAsync("An error occurred while updating the appointment");
            }
        }
        private static async Task DenyAppt(HttpContext context)
        {
            var authenticated = await Authenticate(context);
            if (!authenticated) { return; }
            var requestBody = await new StreamReader(context.Request.Body).ReadToEndAsync();
            try
            {
                var appt = JsonConvert.DeserializeObject<Appointment>(requestBody);

                if (appt == null)
                {
                    context.Response.StatusCode = 400; // Bad Request
                    await context.Response.WriteAsync("Invalid appointment data");
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
                    requestedAppt.Type = null;
                    requestedAppt.Price = null;
                    requestedAppt.Duration = null;
                    requestedAppt.ClientId = null;
                    requestedAppt.Client = null;
                    requestedAppt.Status = Appointment.StatusOptions.Available;
                    await dbContext.SaveChangesAsync();
                }

                context.Response.StatusCode = 200; // OK
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync("Appointment Remains Available");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred: {ex.Message}");
                context.Response.StatusCode = 500; // Internal Server Error
                await context.Response.WriteAsync("An error occurred while updating the appointment");
            }
        }
        private static async Task CompleteAppt(HttpContext context)
        {
            var authenticated = await Authenticate(context);
            if (!authenticated) { return; }
            var requestBody = await new StreamReader(context.Request.Body).ReadToEndAsync();
            try
            {
                var appt = JsonConvert.DeserializeObject<Appointment>(requestBody);

                if (appt == null)
                {
                    context.Response.StatusCode = 400; // Bad Request
                    await context.Response.WriteAsync("Invalid appointment data");
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
                    var client = await dbContext.Clients.FindAsync(requestedAppt.ClientId);
                    if (client == null)
                    {
                        context.Response.StatusCode = 404; // Not Found
                        await context.Response.WriteAsync("Appointment not found");
                        return;
                    }
                    client.Balance += requestedAppt.Price ?? 0;
                    requestedAppt.Status = Appointment.StatusOptions.Completed;
                    await dbContext.SaveChangesAsync();
                }

                context.Response.StatusCode = 200; // OK
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync("Appointment Set Complete");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred: {ex.Message}");
                context.Response.StatusCode = 500; // Internal Server Error
                await context.Response.WriteAsync("An error occurred while updating the appointment");
            }
        }
        private static async Task AdjustBalance(HttpContext context)
        {
            var authenticated = await Authenticate(context);
            if (!authenticated) { return; }
            var requestBody = await new StreamReader(context.Request.Body).ReadToEndAsync();
            try
            {
                var appt = JsonConvert.DeserializeObject<Appointment>(requestBody);

                if (appt == null)
                {
                    context.Response.StatusCode = 400; // Bad Request
                    await context.Response.WriteAsync("Invalid appointment data");
                    return;
                }

                using (var scope = context.RequestServices.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<StretchSchedulerContext>();
                    var client = await dbContext.Clients.FindAsync(appt.ClientId);
                    if (client == null)
                    {
                        context.Response.StatusCode = 404; // Not Found
                        await context.Response.WriteAsync("Appointment not found");
                        return;
                    }
                    client.Balance -= appt.Price ?? 0;
                    await dbContext.SaveChangesAsync();
                }

                context.Response.StatusCode = 200; // OK
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync("Appointment Set Complete");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred: {ex.Message}");
                context.Response.StatusCode = 500; // Internal Server Error
                await context.Response.WriteAsync("An error occurred while updating the appointment");
            }
        }
        private static async Task DeleteAppt(HttpContext context)
        {
            var authenticated = await Authenticate(context);
            if (!authenticated) { return; }
            var requestBody = await new StreamReader(context.Request.Body).ReadToEndAsync();
            try
            {
                var appt = JsonConvert.DeserializeObject<Appointment>(requestBody);

                if (appt == null)
                {
                    context.Response.StatusCode = 400; // Bad Request
                    await context.Response.WriteAsync("Invalid appointment data");
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
                    dbContext.Appointments.Remove(requestedAppt);
                    await dbContext.SaveChangesAsync();
                }

                context.Response.StatusCode = 200; // OK
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync("Appointment deleted successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred: {ex.Message}");
                context.Response.StatusCode = 500; // Internal Server Error
                await context.Response.WriteAsync("An error occurred while deleting the appointment");
            }
        }
        private static async Task DeleteClient(HttpContext context)
        {
            var authenticated = await Authenticate(context);
            if (!authenticated) { return; }
            var requestBody = await new StreamReader(context.Request.Body).ReadToEndAsync();
            try
            {
                var client = JsonConvert.DeserializeObject<Client>(requestBody);

                if (client == null)
                {
                    context.Response.StatusCode = 400; // Bad Request
                    await context.Response.WriteAsync("Invalid client data");
                    return;
                }

                using (var scope = context.RequestServices.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<StretchSchedulerContext>();
                    var requestedClient = await dbContext.Clients.FirstOrDefaultAsync(c => c.Email == client.Email);
                    if (requestedClient == null)
                    {
                        context.Response.StatusCode = 404; // Not Found
                        await context.Response.WriteAsync("Client not found");
                        return;
                    }
                    dbContext.Clients.Remove(requestedClient);
                    await dbContext.SaveChangesAsync();
                }

                context.Response.StatusCode = 200; // OK
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(JsonConvert.SerializeObject(client) + " deleted successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred: {ex.Message}");
                context.Response.StatusCode = 500; // Internal Server Error
                await context.Response.WriteAsync("An error occurred while deleting the client");
            }
        }
    }
}