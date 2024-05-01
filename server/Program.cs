
using dotenv.net;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace StretchScheduler
{
    public class Startup
    {
        public void ConfigureServices(IServiceCollection services)
        {
            DotEnv.Load();

            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("ouP12@fsNv#27G48E1l1e53T59l8V0Af")),
                        ValidIssuer = "http://localhost:5062",
                        ValidAudience = "http://localhost:5173"
                    };
                });
            services.AddDbContext<StretchSchedulerContext>();
            services.AddControllers();
        }

        // Configure the HTTP request pipeline
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            app.UseAuthentication();
            // Use developer exception page if in development mode
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            app.UseHttpsRedirection();
            app.UseRouting();
            app.UseAuthorization();
            app.UseCors(builder =>
            {
                // builder.WithOrigins("http://127.0.0.1:5500", "http://localhost:5173")
                builder.AllowAnyOrigin()
                       .AllowAnyMethod()
                       .AllowAnyHeader();
            });
            app.UseEndpoints(endpoints =>
            {
                AdminRoutes.MapEndpoints(endpoints);
                UserRoutes.MapEndpoints(endpoints);
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
