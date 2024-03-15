using System;

namespace StretchScheduler.Models
{
    public class Time
    {
        public int Id { get; set; }
        public string TimeOfDay { get; set; }
        public bool booked { get; set; } = false;
        public bool requested { get; set; } = false;
        public int ClientId { get; set; }
        public Client Client { get; set; }
        public int DateId { get; set; } 
        public Date Date { get; set; }   
    }
}