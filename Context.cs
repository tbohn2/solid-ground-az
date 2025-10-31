using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using StretchScheduler.Models;
using Npgsql;
using Npgsql.EntityFrameworkCore.PostgreSQL;


public class StretchSchedulerContext : DbContext
{
  static readonly string? connectionString = Environment.GetEnvironmentVariable("POSTGRES_CONNECTION_STRING");
  public DbSet<Appointment> Appointments { get; set; }
  public DbSet<ApptType> ApptTypes { get; set; }
  public DbSet<Client> Clients { get; set; }
  public DbSet<Admin> Admins { get; set; }
  protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
  {
    if (connectionString == null)
    {
      Console.WriteLine("Connection string not found or not set.");
      // Handle the case where the connection string is not available
      return;
    }
    
    // Parse connection string and resolve to IPv4 for reliable cloud connectivity
    var builder = new NpgsqlConnectionStringBuilder(connectionString);
    
    // Resolve hostname to IPv4 address for production reliability
    // Supabase provides both IPv4 and IPv6, but IPv4 is more reliable for cloud deployments like Render
    try
    {
      Console.WriteLine($"Resolving '{builder.Host}' to IPv4 address...");
      
      // Try GetHostAddresses with IPv4 filter first (most direct method)
      var ipv4Addresses = System.Net.Dns.GetHostAddresses(builder.Host, System.Net.Sockets.AddressFamily.InterNetwork);
      if (ipv4Addresses.Length > 0)
      {
        builder.Host = ipv4Addresses[0].ToString();
        Console.WriteLine($"  ✓ Resolved to IPv4: {builder.Host}");
      }
      else
      {
        // Fallback: Try GetHostEntry and filter for IPv4
        var hostEntry = System.Net.Dns.GetHostEntry(builder.Host);
        var ipv4 = hostEntry.AddressList.FirstOrDefault(ip => ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork);
        if (ipv4 != null)
        {
          builder.Host = ipv4.ToString();
          Console.WriteLine($"  ✓ Resolved to IPv4: {builder.Host}");
        }
        else
        {
          Console.WriteLine($"  ⚠ WARNING: No IPv4 address found, will use hostname (may fallback to IPv6)");
        }
      }
    }
    catch (Exception ex)
    {
      Console.WriteLine($"  ⚠ DNS resolution failed: {ex.Message}, will use hostname");
    }
    
    var finalConnectionString = builder.ConnectionString;
    
    optionsBuilder.UseNpgsql(finalConnectionString, npgsqlOptions =>
    {
      npgsqlOptions.CommandTimeout(30);
      // Enable retry for transient failures in production
      var isDevelopment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development";
      if (!isDevelopment)
      {
        npgsqlOptions.EnableRetryOnFailure(
          maxRetryCount: 3,
          maxRetryDelay: TimeSpan.FromSeconds(5),
          errorCodesToAdd: null);
      }
    });
  }
  
  protected override void OnModelCreating(ModelBuilder modelBuilder)
  {
    base.OnModelCreating(modelBuilder);
    
    // Configure DateTime properties to use timestamp without time zone for PostgreSQL
    // This avoids timezone mismatch issues when comparing with DateTime.Now
    foreach (var entityType in modelBuilder.Model.GetEntityTypes())
    {
      var properties = entityType.GetProperties()
          .Where(p => p.ClrType == typeof(DateTime) || p.ClrType == typeof(DateTime?));
      
      foreach (var property in properties)
      {
        property.SetColumnType("timestamp without time zone");
      }
    }
  }
}