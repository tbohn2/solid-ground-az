namespace StretchScheduler.Models
{
    public class Appointment
    {
        public int Id { get; set; }
        public string? Type { get; set; }
        public int? Duration { get; set; }
        public int? Price { get; set; }
        public required DateTime DateTime { get; set; } //Format: "yyyy-MM-dd HH:mm:ss"
        public enum StatusOptions
        {
            Available,
            Requested,
            Booked,
            Completed
        }
        public StatusOptions Status { get; set; } = StatusOptions.Available;
        public int? ClientId { get; set; }
        public Client? Client { get; set; }
    }
}