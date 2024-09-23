using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using StretchScheduler.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System;
using System.Net;
using System.Net.Mail;


namespace StretchScheduler
{
    public static class MiscRoutes
    {
        public static void MapEndpoints(IEndpointRouteBuilder endpoints)
        {
            endpoints.MapPost("/api/devEmail", SendEmail);

        }
        public static async Task WriteResponseAsync(HttpContext context, int statusCode, string contentType, object data)
        {
            context.Response.StatusCode = statusCode;
            context.Response.ContentType = contentType;
            await context.Response.WriteAsync(JsonConvert.SerializeObject(data));
            return;
        }
        private static async Task SendEmail(HttpContext context)
        {
            var requestBody = await new StreamReader(context.Request.Body).ReadToEndAsync();
            try
            {
                Console.WriteLine("Request body: " + requestBody);
                var userEmail = JsonConvert.DeserializeObject<Email>(requestBody);
                if (userEmail == null)
                {
                    await WriteResponseAsync(context, 400, "application/json", "Invalid data, please provide required email data");
                    return;
                }

                var email = "tannerbohndev@gmail.com";
                var password = Environment.GetEnvironmentVariable("DEVGPW");
                if (password == null || password == "")
                {
                    await WriteResponseAsync(context, 500, "application/json", "Server error; Email credentials not found");
                    return;
                }

                SmtpClient smtpClient = new SmtpClient("smtp.gmail.com");
                smtpClient.Port = 587;
                smtpClient.Credentials = new NetworkCredential(email, password);
                smtpClient.EnableSsl = true;

                MailMessage mailMessage = new MailMessage();
                mailMessage.From = new MailAddress(userEmail.EmailAddress);
                mailMessage.To.Add(email);
                mailMessage.Subject = "New Message from " + userEmail.FirstName + " " + userEmail.LastName;
                mailMessage.Body = userEmail.FirstName + " " + userEmail.LastName + " (" + userEmail.EmailAddress + ")" + " sent the following message: " + userEmail.Message;

                try
                {
                    smtpClient.Send(mailMessage);
                    Console.WriteLine("Email sent successfully.");
                    await WriteResponseAsync(context, 200, "application/json", "Email sent successfully");
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Failed to send email: " + ex.Message);
                    await context.Response.WriteAsync(ex.Message);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred: {ex.Message}");
                await WriteResponseAsync(context, 500, "application/json", "An error occurred while sending the email");
            }
        }
    }
}