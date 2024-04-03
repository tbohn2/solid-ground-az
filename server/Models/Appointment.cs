using System;

namespace StretchScheduler.Models
{
    public class Appointment
    {
        public int Id { get; set; }
        public required string Type { get; set; }
        public required string TimeOfDay { get; set; }
        public required int Duration { get; set; }
        public bool Booked { get; set; } = false;
        public bool Requested { get; set; } = false;
        // public int ClientId { get; set; }
        // public Client Client { get; set; }
        public required int DateId { get; set; } // Foreign key
        public Date? Date { get; set; }
    }
}