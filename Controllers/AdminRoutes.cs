using System;
using System.Net;
using System.Net.Mail;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using StretchScheduler.Models;

namespace StretchScheduler
{
    public static class AdminRoutes
    {
        public static void MapEndpoints(IEndpointRouteBuilder endpoints)
        {
            endpoints.MapMethods("api/{*path}", new[] { "OPTIONS" }, AllowAccess);
            endpoints.MapGet("/api/{id}/allAppts/{month}/{year}", GetAllAppts);
            endpoints.MapGet("/api/{id}/allServices", GetAllServices);
            endpoints.MapGet("/api/{id}/clients", GetClients);
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
            var JWT_KEY = Environment.GetEnvironmentVariable("JWT_KEY");
            if (JWT_KEY == null || JWT_KEY == "")
            {
                await WriteResponseAsync(context, 500, "application/json", "JWT key not found in environment variables.");
                return false;
            }

            if (!context.Request.Cookies.TryGetValue("id_token", out var token) || string.IsNullOrEmpty(token))
            {
                await WriteResponseAsync(context, 401, "application/json", "Unauthorized. Please log in.");
                return false;
            }

            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = "https://solidgroundaz.com",
                    ValidAudience = "https://solidgroundaz.com",
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JWT_KEY)),
                };

                var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);

                if (principal != null)
                {
                    context.User = principal;
                    return true;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"JWT validation failed: {ex.Message}");
            }

            await WriteResponseAsync(context, 401, "application/json", "Unauthorized. Invalid or expired token.");
            return false;
        }
        private static async Task WriteEmail(HttpContext context, string clientEmail, string subject, string message)
        {
            var email = Environment.GetEnvironmentVariable("EMAIL");
            var password = Environment.GetEnvironmentVariable("GPW");
            if (email == null || email == "" || password == null || password == "")

            {
                await WriteResponseAsync(context, 500, "application/json", "Email credentials not found");
                return;
            }

            SmtpClient smtpClient = new SmtpClient("smtp.gmail.com");
            smtpClient.Port = 587;
            smtpClient.Credentials = new NetworkCredential(email, password);
            smtpClient.EnableSsl = true;

            MailMessage mailMessage = new MailMessage();
            mailMessage.From = new MailAddress(email);
            mailMessage.To.Add(clientEmail);
            mailMessage.Subject = subject;
            mailMessage.Body = message;
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
        private static async Task GetAllAppts(HttpContext context)
        {
            var authenticated = await Authenticate(context);
            if (!authenticated) { return; }
            try
            {
                if (context.Request.RouteValues["month"] == null || context.Request.RouteValues["year"] == null || context.Request.RouteValues["id"] == null || context.Request.RouteValues["id"]?.ToString() == null)
                {
                    await WriteResponseAsync(context, 400, "application/json", "Invalid month, year, or admin id");
                    return;
                }

                var idString = context.Request.RouteValues["id"]?.ToString();
                Guid.TryParse(idString, out Guid adminId);

                var month = Convert.ToInt32(context.Request.RouteValues["month"]);
                var year = Convert.ToInt32(context.Request.RouteValues["year"]);


                using (var scope = context.RequestServices.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<StretchSchedulerContext>();
                    var appts = await dbContext.Appointments.Where(a => a.DateTime.Month == month && a.DateTime.Year == year && a.AdminId == adminId).Include(a => a.Client).OrderBy(a => a.DateTime).ToListAsync();
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
                    if (context.Request.RouteValues["id"] == null || context.Request.RouteValues["id"]?.ToString() == null)
                    {
                        await WriteResponseAsync(context, 400, "application/json", "Invalid admin id");
                        return;
                    }
                    var idString = context.Request.RouteValues["id"]?.ToString();
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

            if (context.Request.RouteValues["id"] == null || context.Request.RouteValues["id"]?.ToString() == null)
            {
                await WriteResponseAsync(context, 400, "application/json", "Invalid admin id");
                return;
            }
            var idString = context.Request.RouteValues["id"]?.ToString();
            if (Guid.TryParse(idString, out Guid adminId))

                using (var scope = context.RequestServices.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<StretchSchedulerContext>();
                    var clients = await dbContext.Clients.Where(c => c.AdminId == adminId).ToListAsync();
                    var appts = await dbContext.Appointments.Where(a => a.Status != Appointment.StatusOptions.Available && a.AdminId == adminId).ToListAsync();
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

                    var JWT_KEY = Environment.GetEnvironmentVariable("JWT_KEY");
                    if (string.IsNullOrEmpty(JWT_KEY))
                    {
                        await WriteResponseAsync(context, 500, "application/json", "JWTKEY not found in env on server");
                        return;
                    }

                    var jwtToken = admin.GenerateJwtToken(JWT_KEY, "https://solidgroundaz.com", "https://solidgroundaz.com", 60);

                    context.Response.Cookies.Append("id_token", jwtToken, new CookieOptions
                    {
                        HttpOnly = true,
                        Secure = true,
                        SameSite = SameSiteMode.Strict,
                        Expires = DateTimeOffset.UtcNow.AddMinutes(60)
                    });

                    await WriteResponseAsync(context, 200, "application/json", new { id = admin.Id });
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

                if (newAppts == null || newAppts.Count == 0)
                {
                    await WriteResponseAsync(context, 400, "application/json", "No appointments to add");
                    return;
                }

                using (var scope = context.RequestServices.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<StretchSchedulerContext>();
                    ApptType? newApptType = null;

                    if (newAppts[0].ApptTypeId != null)
                    {
                        var requestedApptType = await dbContext.ApptTypes.FindAsync(newAppts[0].ApptTypeId);
                        if (requestedApptType == null)
                        {
                            await WriteResponseAsync(context, 404, "application/json", "Appointment type not found");
                            return;
                        }
                        newApptType = requestedApptType;
                    }

                    foreach (var newAppt in newAppts)
                    {
                        newAppt.ApptType = newApptType;
                        await dbContext.Appointments.AddAsync(newAppt);
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

                    var service = await dbContext.ApptTypes.FindAsync(requestedAppt.ApptTypeId);
                    if (service == null)
                    {
                        await WriteResponseAsync(context, 404, "application/json", "Service not found");
                        return;
                    }

                    string clientEmail = requestedAppt.Client.Email;
                    string subject = "Appointment Confirmation";
                    string message = "Your appointment has been confirmed for " + requestedAppt.DateTime.ToLocalTime().ToString("MMMM dd, yyyy 'at' h:mm tt")
                     + " for the following session: " + service.Name + ". See you soon!";

                    await WriteEmail(context, clientEmail, subject, message);
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
                var client = JsonConvert.DeserializeObject<Client>(requestBody);

                if (client == null)
                {
                    await WriteResponseAsync(context, 400, "application/json", "Invalid client data");
                    return;
                }

                using (var scope = context.RequestServices.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<StretchSchedulerContext>();
                    var reqClient = await dbContext.Clients.FindAsync(client.Id);
                    if (reqClient == null)
                    {
                        await WriteResponseAsync(context, 404, "application/json", "Client not found");
                        return;
                    }

                    var futureAppointment = await dbContext.Appointments.FirstOrDefaultAsync(a => a.ClientId == client.Id && a.DateTime > DateTime.Now);
                    if (futureAppointment == null)
                    {
                        var appointments = await dbContext.Appointments.Where(a => a.ClientId == client.Id).ToListAsync();
                        dbContext.Appointments.RemoveRange(appointments);
                        dbContext.Clients.Remove(reqClient);
                    }
                    else
                    {
                        reqClient.Balance = 0;
                    }

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
                    requestedApptType.ShortDescription = apptType.ShortDescription;
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