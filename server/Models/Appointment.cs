namespace StretchScheduler.Models
{
    public class Appointment
    {
        public int Id { get; set; }
        public string? Type { get; set; }
        public int? Duration { get; set; }
        public int? Price { get; set; }
        public required string Time { get; set; }
        public required int Date { get; set; }
        public required int Month { get; set; }
        public required int Year { get; set; }
        public bool Booked { get; set; } = false;
        public bool Requested { get; set; } = false;
        public int? ClientId { get; set; }
        public Client? Client { get; set; }
    }
}