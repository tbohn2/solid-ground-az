using System;
using Microsoft.EntityFrameworkCore;
using StretchScheduler.Models;

public class StretchSchedulerContext : DbContext
{
  static readonly string? connectionString = Environment.GetEnvironmentVariable("MYSQL_CONNECTION_STRING");
  public DbSet<Appointment> Appointments { get; set; }
  public DbSet<Client> Clients { get; set; }
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