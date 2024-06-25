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
            endpoints.MapMethods("api/{*path}", new[] { "OPTIONS" }, AllowAccess);
            endpoints.MapGet("/api/allAppts/{month}/{year}", GetAllAppts);
            endpoints.MapGet("/api/allServices", GetAllServices);
            endpoints.MapGet("/api/clients", GetClients);
            endpoints.MapPost("/api/login", Login);
            endpoints.MapPost("/api/newAdmin", CreateAdmin);
            endpoints.MapPost("/api/newAppts", CreateNewAppts);
            endpoints.MapPost("/api/newApptType", CreateApptType);
            endpoints.MapPut("/api/approveAppt", ApproveAppt);
            endpoints.MapPut("/api/denyAppt", DenyAppt);
            endpoints.MapPut("/api/completeAppt", CompleteAppt);
            endpoints.MapPut("/api/adjustBalance", AdjustBalance);
            endpoints.MapPut("/api/editApptType", EditApptType);
            endpoints.MapPut("/api/editAppt", EditAppt);
            endpoints.MapDelete("/api/deleteAppt", DeleteAppt);
            endpoints.MapDelete("/api/deleteApptType", DeleteApptType);
            endpoints.MapDelete("/api/deleteClient", DeleteClient);
        }
        public static async Task WriteResponseAsync(HttpContext context, int statusCode, string contentType, object data)
        {
            context.Response.StatusCode = statusCode;
            context.Response.ContentType = contentType;
            await context.Response.WriteAsync(JsonConvert.SerializeObject(data));
            return;
        }
        private static async Task AllowAccess(HttpContext context)
        {
            context.Response.Headers.Append("Access-Control-Allow-Origin", "*");
            context.Response.Headers.Append("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            context.Response.Headers.Append("Access-Control-Allow-Headers", "Content-Type, Authorization");
            context.Response.StatusCode = 200; // OK
            await context.Response.WriteAsync("Access granted");
        }
        private static async Task<bool> Authenticate(HttpContext context)
        {
            var authenticated = await context.AuthenticateAsync(JwtBearerDefaults.AuthenticationScheme);

            if (authenticated.Succeeded)
            {
                return true;
            }
            else
            {
                await WriteResponseAsync(context, 401, "application/json", "Unauthorized. Refresh the page and log in.");
                return false;
            }
        }
        private static async Task GetAllAppts(HttpContext context)
        {
            var authenticated = await Authenticate(context);
            if (!authenticated) { return; }
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
                    var appts = await dbContext.Appointments.Where(a => a.DateTime.Month == month && a.DateTime.Year == year).Include(a => a.Client).OrderBy(a => a.DateTime).ToListAsync();
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
        private static async Task GetAllServices(HttpContext context)
        {
            var authenticated = await Authenticate(context);
            if (!authenticated) { return; }
            try
            {
                using (var scope = context.RequestServices.CreateScope())
                {
                    var idString = Environment.GetEnvironmentVariable("ID");
                    if (Guid.TryParse(idString, out Guid adminId))
                    {
                        var dbContext = scope.ServiceProvider.GetRequiredService<StretchSchedulerContext>();
                        var services = await dbContext.ApptTypes.Where(a => a.AdminId == adminId).ToListAsync();
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
                await WriteResponseAsync(context, 200, "application/json", clientData);
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
                    await WriteResponseAsync(context, 400, "application/json", "Invalid username or password");
                    return;
                }

                using (var scope = context.RequestServices.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<StretchSchedulerContext>();
                    var admin = await dbContext.Admins.FirstOrDefaultAsync(a => a.Username == adminLoggingIn.Username);

                    if (admin == null || !admin.VerifyPassword(adminLoggingIn.Password))
                    {
                        await WriteResponseAsync(context, 401, "application/json", "Invalid username or password");
                        return;
                    }

                    var jwtToken = admin.GenerateJwtToken("ouP12@fsNv#27G48E1l1e53T59l8V0Af", "http://localhost:5062", "http://localhost:5173", 60);

                    await WriteResponseAsync(context, 200, "application/json", new { id = admin.Id, token = jwtToken });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred: {ex.Message}");
                await WriteResponseAsync(context, 500, "application/json", "An error occurred while processing the request");
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
                    await WriteResponseAsync(context, 400, "application/json", "Invalid admin data");
                    return;
                }

                using (var scope = context.RequestServices.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<StretchSchedulerContext>();


                    var existingAdmin = await dbContext.Admins.FirstOrDefaultAsync(a => a.Username == adminData.Username);
                    if (existingAdmin != null)
                    {
                        await WriteResponseAsync(context, 400, "application/json", "Username already exists");
                        return;
                    }

                    adminData.SetPassword(adminData.Password);

                    await dbContext.Admins.AddAsync(adminData);
                    await dbContext.SaveChangesAsync();

                    await WriteResponseAsync(context, 201, "application/json", adminData);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred: {ex.Message}");
                await WriteResponseAsync(context, 500, "application/json", "An error occurred while creating the admin");
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
                    await WriteResponseAsync(context, 400, "application/json", "Invalid appointment data");
                    return;
                }

                using (var scope = context.RequestServices.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<StretchSchedulerContext>();

                    foreach (var newAppt in newAppts)
                    {
                        // If there is no appointment type, the appointment is available; otherwise it is firm
                        if (newAppt.ApptTypeId == null)
                        {
                            newAppt.Status = Appointment.StatusOptions.Available;
                            await dbContext.Appointments.AddAsync(newAppt);
                        }
                        else
                        {
                            var requestedApptType = await dbContext.ApptTypes.FindAsync(newAppt.ApptTypeId);
                            if (requestedApptType == null)
                            {
                                await WriteResponseAsync(context, 404, "application/json", "Appointment type not found");
                                return;
                            }
                            newAppt.ApptType = requestedApptType;
                            // If the appointment type is not private, the appointment is firm 
                            if (requestedApptType.Private)
                            {
                                newAppt.Status = Appointment.StatusOptions.Available;
                            }
                            else
                            {
                                newAppt.Status = Appointment.StatusOptions.Firm;
                            }
                            await dbContext.Appointments.AddAsync(newAppt);
                        }
                    }
                    await dbContext.SaveChangesAsync();
                }

                await WriteResponseAsync(context, 201, "application/json", "Successfully created appointments");
            }
            catch (DbUpdateException ex)
            {
                Console.WriteLine($"An error occurred while saving changes to the database: {ex.InnerException?.Message}");
                await WriteResponseAsync(context, 500, "application/json", "An error occurred while saving changes to the database.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred: {ex.Message}");
                await WriteResponseAsync(context, 500, "application/json", "An error occurred while creating the appointments.");
            }
        }
        private static async Task CreateApptType(HttpContext context)
        {
            var authenticated = await Authenticate(context);
            if (!authenticated) { return; }
            var requestBody = await new StreamReader(context.Request.Body).ReadToEndAsync();
            try
            {
                var apptType = JsonConvert.DeserializeObject<ApptType>(requestBody);

                if (apptType == null)
                {
                    await WriteResponseAsync(context, 400, "application/json", "Invalid appointment type data");
                    return;
                }

                using (var scope = context.RequestServices.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<StretchSchedulerContext>();
                    await dbContext.ApptTypes.AddAsync(apptType);
                    await dbContext.SaveChangesAsync();
                }

                await WriteResponseAsync(context, 201, "application/json", apptType);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred: {ex.Message}");
                await WriteResponseAsync(context, 500, "application/json", "An error occurred while creating the appointment type");
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
                    await WriteResponseAsync(context, 400, "application/json", "Invalid appointment data");
                    return;
                }

                using (var scope = context.RequestServices.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<StretchSchedulerContext>();
                    var requestedAppt = await dbContext.Appointments.Include(a => a.Client).FirstOrDefaultAsync(a => a.Id == appt.Id);
                    if (requestedAppt == null || requestedAppt.Client == null)
                    {
                        await WriteResponseAsync(context, 404, "application/json", "Appointment or Client not found");
                        return;
                    }
                    requestedAppt.Status = Appointment.StatusOptions.Booked;
                    await dbContext.SaveChangesAsync();

                    var email = Environment.GetEnvironmentVariable("EMAIL");
                    var password = Environment.GetEnvironmentVariable("GPW");
                    if (email == null || password == null)
                    {
                        await WriteResponseAsync(context, 500, "application/json", "Email credentials not found");
                        return;
                    }

                    // Console.WriteLine(requestedAppt.ApptType.Name, requestedAppt.ApptType.Price, requestedAppt.ApptType.Duration); // to test

                    SmtpClient smtpClient = new SmtpClient("smtp.gmail.com");
                    smtpClient.Port = 587;
                    smtpClient.Credentials = new NetworkCredential(email, password);
                    smtpClient.EnableSsl = true;

                    MailMessage mailMessage = new MailMessage();
                    mailMessage.From = new MailAddress(email);
                    mailMessage.To.Add(requestedAppt.Client.Email);
                    mailMessage.Subject = "Appointment Confirmation";
                    mailMessage.Body = "Your appointment has been confirmed for " + requestedAppt.DateTime.ToLocalTime().ToString("MMMM dd, yyyy 'at' h:mm tt")
                     + " for the following session: " + requestedAppt.ApptType + ". See you soon!";

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
                await WriteResponseAsync(context, 500, "application/json", "An error occurred while updating the appointment");
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
                    await WriteResponseAsync(context, 400, "application/json", "Invalid appointment data");
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
                    requestedAppt.ApptTypeId = null;
                    requestedAppt.ApptType = null;
                    requestedAppt.ClientId = null;
                    requestedAppt.Client = null;
                    requestedAppt.Status = Appointment.StatusOptions.Available;
                    await dbContext.SaveChangesAsync();
                }

                await WriteResponseAsync(context, 200, "application/json", "Appointment Remains Available");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred: {ex.Message}");
                await WriteResponseAsync(context, 500, "application/json", "An error occurred while updating the appointment");
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

                if (appt == null || appt.ApptType == null)
                {
                    await WriteResponseAsync(context, 400, "application/json", "Invalid appointment data");
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
                    var client = await dbContext.Clients.FindAsync(requestedAppt.ClientId);
                    if (client == null)
                    {
                        await WriteResponseAsync(context, 404, "application/json", "Client not found");
                        return;
                    }
                    client.Balance += appt.ApptType.Price;
                    requestedAppt.Status = Appointment.StatusOptions.Completed;
                    await dbContext.SaveChangesAsync();
                }

                await WriteResponseAsync(context, 200, "application/json", "Appointment Complete");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred: {ex.Message}");
                await WriteResponseAsync(context, 500, "application/json", "An error occurred while updating the appointment");
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
                    await WriteResponseAsync(context, 400, "application/json", "Invalid appointment data");
                    return;
                }

                using (var scope = context.RequestServices.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<StretchSchedulerContext>();
                    var client = await dbContext.Clients.FindAsync(appt.ClientId);
                    if (client == null)
                    {
                        await WriteResponseAsync(context, 404, "application/json", "Client not found");
                        return;
                    }
                    client.Balance = 0;
                    await dbContext.SaveChangesAsync();
                }

                await WriteResponseAsync(context, 200, "application/json", "Appointment Set Complete");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred: {ex.Message}");
                await WriteResponseAsync(context, 500, "application/json", "An error occurred while updating the appointment");
            }
        }
        private static async Task EditApptType(HttpContext context)
        {
            var authenticated = await Authenticate(context);
            if (!authenticated) { return; }
            var requestBody = await new StreamReader(context.Request.Body).ReadToEndAsync();
            try
            {
                var apptType = JsonConvert.DeserializeObject<ApptType>(requestBody);

                if (apptType == null)
                {
                    await WriteResponseAsync(context, 400, "application/json", "Invalid appointment type data");
                    return;
                }

                using (var scope = context.RequestServices.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<StretchSchedulerContext>();
                    var requestedApptType = await dbContext.ApptTypes.FindAsync(apptType.Id);
                    if (requestedApptType == null)
                    {
                        await WriteResponseAsync(context, 404, "application/json", "Appointment type not found");
                        return;
                    }
                    requestedApptType.Name = apptType.Name;
                    requestedApptType.Duration = apptType.Duration;
                    requestedApptType.Price = apptType.Price;
                    requestedApptType.Description = apptType.Description;
                    requestedApptType.LocationName = apptType.LocationName;
                    requestedApptType.LocationAddress = apptType.LocationAddress;
                    requestedApptType.Private = apptType.Private;
                    requestedApptType.ImgURL = apptType.ImgURL;
                    await dbContext.SaveChangesAsync();
                }

                await WriteResponseAsync(context, 200, "application/json", apptType);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred: {ex.Message}");
                await WriteResponseAsync(context, 500, "application/json", "An error occurred while updating the appointment type");
            }
        }
        private static async Task EditAppt(HttpContext context)
        {
            var authenticated = await Authenticate(context);
            if (!authenticated) { return; }
            var requestBody = await new StreamReader(context.Request.Body).ReadToEndAsync();
            try
            {
                var appt = JsonConvert.DeserializeObject<Appointment>(requestBody);

                if (appt == null)
                {
                    await WriteResponseAsync(context, 400, "application/json", "Invalid appointment data");
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

                    requestedAppt.DateTime = appt.DateTime;
                    if (requestedAppt.ApptTypeId != appt.ApptTypeId)
                    {
                        requestedAppt.ApptTypeId = appt.ApptTypeId;
                        var requestedApptType = await dbContext.ApptTypes.FindAsync(appt.ApptTypeId);
                        if (requestedApptType != null) { requestedAppt.ApptType = requestedApptType; }
                    }

                    await dbContext.SaveChangesAsync();
                }

                await WriteResponseAsync(context, 200, "application/json", appt);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred: {ex.Message}");
                await WriteResponseAsync(context, 500, "application/json", "An error occurred while updating the appointment");
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
                    await WriteResponseAsync(context, 400, "application/json", "Invalid appointment data");
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
                    dbContext.Appointments.Remove(requestedAppt);
                    await dbContext.SaveChangesAsync();
                }

                await WriteResponseAsync(context, 200, "application/json", "Appointment deleted successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred: {ex.Message}");
                await WriteResponseAsync(context, 500, "application/json", "An error occurred while deleting the appointment");
            }
        }
        private static async Task DeleteApptType(HttpContext context)
        {
            var authenticated = await Authenticate(context);
            if (!authenticated) { return; }
            var requestBody = await new StreamReader(context.Request.Body).ReadToEndAsync();
            try
            {
                var apptType = JsonConvert.DeserializeObject<ApptType>(requestBody);

                if (apptType == null)
                {
                    await WriteResponseAsync(context, 400, "application/json", "Invalid appointment type data");
                    return;
                }

                using (var scope = context.RequestServices.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<StretchSchedulerContext>();

                    var appts = await dbContext.Appointments.Where(a => a.ApptTypeId == apptType.Id).ToListAsync();
                    if (appts.Count != 0)
                    {
                        await WriteResponseAsync(context, 400, "application/json", "This service is currently in use. Please cancel all appointments before deleting the service.");
                        return;
                    }

                    var requestedApptType = await dbContext.ApptTypes.FindAsync(apptType.Id);
                    if (requestedApptType == null)
                    {
                        await WriteResponseAsync(context, 404, "application/json", "Appointment type not found");
                        return;
                    }
                    dbContext.ApptTypes.Remove(requestedApptType);
                    await dbContext.SaveChangesAsync();
                }

                await WriteResponseAsync(context, 200, "application/json", "Appointment type deleted successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred: {ex.Message}");
                await WriteResponseAsync(context, 500, "application/json", "An error occurred while deleting the appointment type");
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
                    await WriteResponseAsync(context, 400, "application/json", "Invalid client data");
                    return;
                }

                using (var scope = context.RequestServices.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<StretchSchedulerContext>();

                    var appts = await dbContext.Appointments.Where(a => a.ClientId == client.Id).ToListAsync();
                    if (appts.Count != 0)
                    {
                        await WriteResponseAsync(context, 400, "application/json", "This client has existing appointments. Please delete all appointments before deleting the client.");
                        return;
                    }

                    var requestedClient = await dbContext.Clients.FirstOrDefaultAsync(c => c.Email == client.Email);
                    if (requestedClient == null)
                    {
                        await WriteResponseAsync(context, 404, "application/json", "Client not found");
                        return;
                    }
                    dbContext.Clients.Remove(requestedClient);
                    await dbContext.SaveChangesAsync();
                }

                await WriteResponseAsync(context, 200, "application/json", client);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred: {ex.Message}");
                await WriteResponseAsync(context, 500, "application/json", "An error occurred while deleting the client");
            }
        }
    }
}