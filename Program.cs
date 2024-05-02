namespace StretchScheduler
{
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
