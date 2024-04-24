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
                endpoints.MapGet("/api/apptsInMonth/{month}/{year}", async context =>
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


                       using (var scope = app.ApplicationServices.CreateScope())
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
               });
                endpoints.MapGet("/api/clients", async context =>
                {
                    using (var scope = app.ApplicationServices.CreateScope())
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
                });
                endpoints.MapPost("/api/newAdmin", async context =>
                {
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

                        using (var scope = app.ApplicationServices.CreateScope())
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
                });

                endpoints.MapPost("/api/newAppts", async context =>
                {
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

                        using (var scope = app.ApplicationServices.CreateScope())
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
                });
                endpoints.MapPut("/api/requestAppt", async context =>
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

                        using (var scope = app.ApplicationServices.CreateScope())
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
                });
                endpoints.MapPut("/api/approveAppt", async context =>
                {
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

                        using (var scope = app.ApplicationServices.CreateScope())
                        {
                            var dbContext = scope.ServiceProvider.GetRequiredService<StretchSchedulerContext>();
                            var requestedAppt = await dbContext.Appointments.FindAsync(appt.Id);
                            if (requestedAppt == null)
                            {
                                context.Response.StatusCode = 404; // Not Found
                                await context.Response.WriteAsync("Appointment not found");
                                return;
                            }
                            requestedAppt.Status = Appointment.StatusOptions.Booked;
                            await dbContext.SaveChangesAsync();
                        }

                        context.Response.StatusCode = 200; // OK
                        context.Response.ContentType = "application/json";
                        await context.Response.WriteAsync("Appointment Set");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"An error occurred: {ex.Message}");
                        context.Response.StatusCode = 500; // Internal Server Error
                        await context.Response.WriteAsync("An error occurred while updating the appointment");
                    }
                });
                endpoints.MapPut("/api/denyAppt", async context =>
                {
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

                        using (var scope = app.ApplicationServices.CreateScope())
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
                });
                endpoints.MapPut("/api/completeAppt", async context =>
                {
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

                        using (var scope = app.ApplicationServices.CreateScope())
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
                });
                endpoints.MapPut("/api/adjustBalance", async context =>
                {
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

                        using (var scope = app.ApplicationServices.CreateScope())
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
                });
                endpoints.MapDelete("/api/deleteAppt", async context =>
                {
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

                        using (var scope = app.ApplicationServices.CreateScope())
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
                });
                endpoints.MapDelete("/api/deleteClient", async context =>
                {
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

                        using (var scope = app.ApplicationServices.CreateScope())
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
                });
            });
        }
    }
}
