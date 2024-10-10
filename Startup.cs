using dotenv.net;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Rewrite;

namespace StretchScheduler
{
    public class Startup
    {
        public void ConfigureServices(IServiceCollection services)
        {
            DotEnv.Load();
            var JWT_KEY = Environment.GetEnvironmentVariable("JWT_KEY");
            if (JWT_KEY == null || JWT_KEY == "")
            {
                throw new Exception("JWTKEY not found in environment variables");
            }

            services.AddCors(options =>
            {
                options.AddPolicy(name: "MyPolicy",
                    policy =>
                    {
                        policy.AllowAnyOrigin()
                                .AllowAnyHeader()
                                .AllowAnyMethod();
                    });
            });

            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JWT_KEY)),
                        ValidIssuer = "https://solidgroundaz.com",
                        ValidAudience = "https://solidgroundaz.com"
                    };
                });
            services.AddDbContext<StretchSchedulerContext>();
            services.AddControllers();
            services.AddRazorPages(options =>
            {
                options.RootDirectory = "/Views";
                options.Conventions.AddAreaPageRoute("Admin", "/Index", "admin");
            });
        }

        // Configure the HTTP request pipeline
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            // Use developer exception page if in development mode
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            app.UseHttpsRedirection();

            app.UseStaticFiles();
            app.UseRouting();

            app.UseCors("MyPolicy");

            app.UseAuthentication();
            app.UseAuthorization();
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapRazorPages();
                AdminRoutes.MapEndpoints(endpoints);
                UserRoutes.MapEndpoints(endpoints);
                MiscRoutes.MapEndpoints(endpoints);
            });
        }
    }
}