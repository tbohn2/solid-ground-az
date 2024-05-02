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

            services.AddRazorPages(options =>
                {
                    options.RootDirectory = "/Views";
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
            var rewriteOptions = new RewriteOptions()
                .AddRewrite(@"^$", "index.html", skipRemainingRules: true)
                .AddRewrite(@"^book$", "book.html", skipRemainingRules: true)
                .AddRewrite(@"^services$", "services.html", skipRemainingRules: true);
            app.UseRewriter(rewriteOptions);
            app.UseStaticFiles();
            app.UseRouting();
            app.UseAuthorization();
            app.UseCors(builder =>
            {
                builder.WithOrigins("http://127.0.0.1:5500", "http://localhost:5173")
                       .AllowAnyMethod()
                       .AllowAnyHeader();
            });
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapRazorPages();
                AdminRoutes.MapEndpoints(endpoints);
                UserRoutes.MapEndpoints(endpoints);
            });


        }
    }
}