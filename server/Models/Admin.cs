using BCrypt.Net;

namespace StretchScheduler.Models
{
    public class Admin
    {
        public int Id { get; set; }
        public required string Username { get; set; }
        public required string Password { get; set; }

        public void SetPassword(string password)
        {
            Password = BCrypt.Net.BCrypt.HashPassword(password);
        }

        public bool VerifyPassword(string password)
        {
            return BCrypt.Net.BCrypt.Verify(password, Password);
        }
    }
}