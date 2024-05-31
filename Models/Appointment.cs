namespace StretchScheduler.Models
{
    public class Appointment
    {
        public int Id { get; set; }
        public required DateTime DateTime { get; set; } //Format: "yyyy-MM-dd HH:mm:ss"
        public enum StatusOptions
        {
            Available,
            Requested,
            Booked,
            Completed,
            Firm
        }
        public required StatusOptions Status { get; set; }
        public int? ApptTypeId { get; set; }
        public ApptType? ApptType { get; set; }
        public required Guid AdminId { get; set; }
        public int? ClientId { get; set; }
        public Client? Client { get; set; }
    }
}