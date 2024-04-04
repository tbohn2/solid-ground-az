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
                endpoints.MapGet("/api/apptsInMonth", async context =>
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
                           var appts = await dbContext.Appointments.Where(a => a.Month == appt.Month && a.Year == appt.Year).Include(a => a.Client).ToListAsync();
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
                        context.Response.StatusCode = 200; // OK
                        context.Response.ContentType = "application/json";
                        await context.Response.WriteAsync(JsonConvert.SerializeObject(clients));
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
                            requestedAppt.ClientId = existingClient.Id;
                            requestedAppt.Client = existingClient;
                            requestedAppt.Requested = true;
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
                            requestedAppt.Booked = true;
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
                            requestedAppt.Booked = false;
                            requestedAppt.Requested = false;
                            requestedAppt.ClientId = null;
                            requestedAppt.Client = null;
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
