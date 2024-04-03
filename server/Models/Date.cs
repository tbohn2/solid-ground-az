using System;

namespace StretchScheduler.Models
{
    public class Date
    {
        public int Id { get; set; }
        public required int DateNumber { get; set; }
        public required int MonthId { get; set; } // Foreign key
        public Month? Month { get; set; }
    }
}