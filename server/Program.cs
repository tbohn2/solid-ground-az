using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System.Linq;
using StretchScheduler.Models;
using dotenv.net;

namespace StretchScheduler
{
    public class StretchSchedulerContext : DbContext
    {
        static readonly string connectionString = Environment.GetEnvironmentVariable("MYSQL_CONNECTION_STRING");

        public DbSet<Year> Years { get; set; }
        public DbSet<Month> Months { get; set; }
        public DbSet<Date> Dates { get; set; }
        public DbSet<Time> Times { get; set; }
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (connectionString == null)
            {
                Console.WriteLine("Connection string not found or not set.");
                // Handle the case where the connection string is not available
            }
            else
            {
                optionsBuilder.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString));
            }
        }
    }

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
