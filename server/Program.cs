using System;
using System.IO;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System.Linq;
using StretchScheduler.Models;
using dotenv.net;
using Newtonsoft.Json;

namespace StretchScheduler
{
    // Define a class for configuring the ASP.NET Core application
    public class Startup
    {
        public void ConfigureServices(IServiceCollection services)
        {
            // Load environment variables
            DotEnv.Load();
            // Add the DbContext to the service collection
            services.AddDbContext<StretchSchedulerContext>();
            // Add controllers to the service collection
            services.AddControllers();
        }

        // Configure the HTTP request pipeline
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            // Use developer exception page if in development mode
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            // Enable routing
            app.UseRouting();

            // Define endpoint for handling GET requests to the root URL
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapGet("/", async context =>
                {
                    await context.Response.WriteAsync("Hello World!");
                });

                endpoints.MapPost("/api/years", async context =>
                {
                    // Read the request body to get the year data
                    var requestBody = await new StreamReader(context.Request.Body).ReadToEndAsync();

                    try
                    {
                        // Deserialize the JSON request body and creates an instance of a Year 
                        var newYear = JsonConvert.DeserializeObject<Year>(requestBody);

                        // Validate the year object
                        if (newYear == null)
                        {
                            context.Response.StatusCode = 400; // Bad Request
                            await context.Response.WriteAsync("Invalid year data");
                            return;
                        }
                        Console.WriteLine($"Year: {newYear.YearNumber}");

                        // Add the new year to the database
                        using (var scope = app.ApplicationServices.CreateScope())
                        {
                            var dbContext = scope.ServiceProvider.GetRequiredService<StretchSchedulerContext>();
                            await dbContext.Years.AddAsync(newYear);
                            await dbContext.SaveChangesAsync();
                        }

                        context.Response.StatusCode = 201; // Created
                        context.Response.ContentType = "application/json";
                        await context.Response.WriteAsync(JsonConvert.SerializeObject(newYear));
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"An error occurred: {ex.Message}");
                        context.Response.StatusCode = 500;
                        await context.Response.WriteAsync("An error occurred while creating the year.");
                    }
                });
            });
        }
    }

    // Define the entry point of the application
    public class Program
    {
        public static void Main(string[] args)
        {
            // Build and run the web host
            CreateHostBuilder(args).Build().Run();
        }

        // Create a default host builder
        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    // Configure the web host using the Startup class
                    webBuilder.UseStartup<Startup>();
                });
    }
}
