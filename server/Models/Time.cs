using System;

namespace StretchScheduler.Models
{
    public class Time
    {
        public int Id { get; set; }
        public required string TimeOfDay { get; set; }
        public bool Booked { get; set; } = false;
        public bool Requested { get; set; } = false;
        // public int ClientId { get; set; }
        // public Client Client { get; set; }
        public int DateNumber { get; set; }
        public required Date Date { get; set; }
    }
}